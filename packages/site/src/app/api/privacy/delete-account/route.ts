import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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
 * Anonymize and soft-delete the current user's account.
 * Prefers anonymization over hard-delete to preserve data integrity
 * (e.g., comment threads remain navigable).
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // 1. Anonymize comments (set content to [deleted], status to deleted_by_author)
    await db
      .update(comments)
      .set({
        content: "[deleted]",
        status: "deleted_by_author",
      })
      .where(eq(comments.authorId, userId));

    // 2. Delete votes
    await db.delete(votes).where(eq(votes.userId, userId));

    // 3. Delete debate stances
    await db.delete(debateStances).where(eq(debateStances.userId, userId));

    // 4. Delete stance shifts
    await db.delete(stanceShifts).where(eq(stanceShifts.userId, userId));

    // 5. Delete verdict votes
    await db.delete(verdictVotes).where(eq(verdictVotes.voterId, userId));

    // 6. Delete argument tags created by this user
    await db.delete(argumentTags).where(eq(argumentTags.taggedBy, userId));

    // 7. Delete federated identity
    await db
      .delete(federatedIdentity)
      .where(eq(federatedIdentity.localUserId, userId));

    // 8. Delete auth accounts (OAuth links)
    await db.delete(accounts).where(eq(accounts.userId, userId));

    // 9. Delete sessions
    await db.delete(sessions).where(eq(sessions.userId, userId));

    // 10. Anonymize the user record rather than hard-deleting
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

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[PRIVACY] Account deletion failed:", error);
    return NextResponse.json(
      { error: "Account deletion failed. Please try again or contact support." },
      { status: 500 },
    );
  }
}
