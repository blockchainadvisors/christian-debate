import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, federatedIdentity, comments, debateStances } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { syncReputationToHub } from "@/lib/hub-client";

/**
 * POST /api/jobs/sync-reputation-to-hub
 *
 * Background job: for all users with a federated identity, gather their
 * reputation data and POST to Hub's /api/federation/sync-reputation.
 *
 * Protected with X-Job-Secret header.
 */
export async function POST(request: NextRequest) {
  const jobSecret = request.headers.get("x-job-secret");
  if (!jobSecret || jobSecret !== process.env.JOB_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all federated users
    const federatedUsers = await db
      .select({
        localUserId: federatedIdentity.localUserId,
        hubUserId: federatedIdentity.hubUserId,
      })
      .from(federatedIdentity);

    if (federatedUsers.length === 0) {
      return NextResponse.json({ synced: 0 });
    }

    // Gather reputation data for each federated user
    const snapshots: Array<{
      hubUserId: string;
      reputationScore: number;
      persuasionRating: number;
      commentCount: number;
      debateCount: number;
    }> = [];

    for (const fedUser of federatedUsers) {
      const [user] = await db
        .select({
          reputationScore: users.reputationScore,
          persuasionRating: users.persuasionRating,
        })
        .from(users)
        .where(eq(users.id, fedUser.localUserId))
        .limit(1);

      if (!user) continue;

      const [commentResult] = await db
        .select({ value: count() })
        .from(comments)
        .where(eq(comments.authorId, fedUser.localUserId));

      const [debateResult] = await db
        .select({ value: count() })
        .from(debateStances)
        .where(eq(debateStances.userId, fedUser.localUserId));

      snapshots.push({
        hubUserId: fedUser.hubUserId,
        reputationScore: user.reputationScore,
        persuasionRating: user.persuasionRating,
        commentCount: commentResult?.value ?? 0,
        debateCount: debateResult?.value ?? 0,
      });
    }

    if (snapshots.length === 0) {
      return NextResponse.json({ synced: 0 });
    }

    // Send to Hub
    const result = await syncReputationToHub(snapshots);

    if (!result) {
      return NextResponse.json(
        { error: "Failed to sync to Hub (Hub may be unreachable)" },
        { status: 502 },
      );
    }

    // Update syncedAt for all federated users
    const now = new Date();
    await Promise.all(
      federatedUsers.map((fedUser) =>
        db
          .update(federatedIdentity)
          .set({ syncedAt: now })
          .where(eq(federatedIdentity.localUserId, fedUser.localUserId)),
      ),
    );

    return NextResponse.json({ synced: result.synced });
  } catch (error) {
    console.error("Failed to run reputation sync job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
