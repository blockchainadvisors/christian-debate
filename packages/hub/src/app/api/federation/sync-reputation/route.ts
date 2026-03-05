import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reputationSnapshots } from "@/db/schema";
import { verifySiteApiKey } from "@/lib/api-auth";
import { updateGlobalReputation } from "@/lib/reputation-aggregation";

interface SnapshotPayload {
  hubUserId: string;
  reputationScore: number;
  persuasionRating: number;
  commentCount: number;
  debateCount: number;
}

export async function POST(request: NextRequest) {
  const siteAuth = await verifySiteApiKey(request);
  if (!siteAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { snapshots?: SnapshotPayload[] };
  try {
    body = await request.clone().json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { snapshots } = body;
  if (!snapshots || !Array.isArray(snapshots) || snapshots.length === 0) {
    return NextResponse.json(
      { error: "snapshots array is required and must not be empty" },
      { status: 400 },
    );
  }

  // Validate each snapshot
  for (const snap of snapshots) {
    if (
      !snap.hubUserId ||
      typeof snap.reputationScore !== "number" ||
      typeof snap.persuasionRating !== "number" ||
      typeof snap.commentCount !== "number" ||
      typeof snap.debateCount !== "number"
    ) {
      return NextResponse.json(
        { error: "Each snapshot must have hubUserId, reputationScore, persuasionRating, commentCount, debateCount" },
        { status: 400 },
      );
    }
  }

  try {
    const now = new Date();

    // Insert all snapshots
    await db.insert(reputationSnapshots).values(
      snapshots.map((snap) => ({
        hubUserId: snap.hubUserId,
        siteId: siteAuth.siteId,
        reputationScore: snap.reputationScore,
        persuasionRating: snap.persuasionRating,
        commentCount: snap.commentCount,
        debateCount: snap.debateCount,
        snapshotAt: now,
      })),
    );

    // Recompute global reputation for each affected user
    const affectedUsers = [...new Set(snapshots.map((s) => s.hubUserId))];
    await Promise.all(
      affectedUsers.map((hubUserId) => updateGlobalReputation(hubUserId)),
    );

    return NextResponse.json({ synced: snapshots.length });
  } catch (error) {
    console.error("Failed to sync reputation snapshots:", error);
    return NextResponse.json(
      { error: "Failed to sync reputation snapshots" },
      { status: 500 },
    );
  }
}
