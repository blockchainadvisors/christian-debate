import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  users,
  accounts,
  sessions,
  comments,
  votes,
  debateStances,
  stanceShifts,
  verdictVotes,
  argumentTags,
  federatedIdentity,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";

/**
 * Called by the Hub when a hub account is deleted.
 * Finds the local user via federatedIdentity and anonymizes their account.
 */
export async function POST(request: NextRequest) {
  // Verify request origin via X-Agora-Site-Id header
  const siteId = request.headers.get("x-agora-site-id");
  if (!siteId) {
    return NextResponse.json(
      { error: "Missing X-Agora-Site-Id header" },
      { status: 401 },
    );
  }

  // Validate against our known hub site ID
  const expectedSiteId = process.env.AGORA_SITE_ID;
  if (expectedSiteId && siteId !== expectedSiteId) {
    return NextResponse.json(
      { error: "Invalid site origin" },
      { status: 403 },
    );
  }

  let body: { hubUserId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { hubUserId } = body;
  if (!hubUserId) {
    return NextResponse.json(
      { error: "hubUserId is required" },
      { status: 400 },
    );
  }

  // Find local user via federated identity
  const [fedRecord] = await db
    .select({ localUserId: federatedIdentity.localUserId })
    .from(federatedIdentity)
    .where(eq(federatedIdentity.hubUserId, hubUserId))
    .limit(1);

  if (!fedRecord) {
    // No local user linked to this hub user — nothing to do
    return NextResponse.json({ deleted: true, note: "No linked local user found" });
  }

  const userId = fedRecord.localUserId;

  try {
    // Anonymize comments
    await db
      .update(comments)
      .set({
        content: "[deleted]",
        status: "deleted_by_author",
      })
      .where(eq(comments.authorId, userId));

    // Delete votes
    await db.delete(votes).where(eq(votes.userId, userId));

    // Delete debate stances
    await db.delete(debateStances).where(eq(debateStances.userId, userId));

    // Delete stance shifts
    await db.delete(stanceShifts).where(eq(stanceShifts.userId, userId));

    // Delete verdict votes
    await db.delete(verdictVotes).where(eq(verdictVotes.voterId, userId));

    // Delete argument tags
    await db.delete(argumentTags).where(eq(argumentTags.taggedBy, userId));

    // Delete federated identity
    await db
      .delete(federatedIdentity)
      .where(eq(federatedIdentity.localUserId, userId));

    // Delete auth accounts
    await db.delete(accounts).where(eq(accounts.userId, userId));

    // Delete sessions
    await db.delete(sessions).where(eq(sessions.userId, userId));

    // Anonymize user record
    const anonymousId = randomBytes(8).toString("hex");
    await db
      .update(users)
      .set({
        username: `deleted_user_${anonymousId}`,
        displayName: "Deleted User",
        email: `deleted_${anonymousId}@deleted.invalid`,
        passwordHash: null,
        avatarUrl: null,
        engagementFingerprint: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    console.log(
      `[FEDERATION] Account anonymized for local user ${userId} ` +
        `(hub user ${hubUserId}) via federation delete-user webhook`,
    );

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[FEDERATION] Delete-user failed:", error);
    return NextResponse.json(
      { error: "Account deletion failed" },
      { status: 500 },
    );
  }
}
