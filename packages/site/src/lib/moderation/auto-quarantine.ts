import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { comments, votes, users } from "@/db/schema";

export async function checkAutoQuarantine(commentId: string): Promise<boolean> {
  // Fetch the comment with author info
  const [comment] = await db
    .select({
      id: comments.id,
      authorId: comments.authorId,
      createdAt: comments.createdAt,
      isQuarantined: comments.isQuarantined,
    })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

  if (!comment || comment.isQuarantined) {
    return comment?.isQuarantined ?? false;
  }

  // Get author's trust tier
  const [author] = await db
    .select({ trustTier: users.trustTier })
    .from(users)
    .where(eq(users.id, comment.authorId))
    .limit(1);

  if (!author) return false;

  const commentCreatedAt = comment.createdAt;

  // Check 1: 5+ uncivil downvotes within 10 minutes of comment creation
  const tenMinutesAfter = new Date(commentCreatedAt.getTime() + 10 * 60 * 1000);

  const [uncivilResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(votes)
    .where(
      and(
        eq(votes.commentId, commentId),
        eq(votes.direction, "down"),
        eq(votes.reason, "uncivil"),
        sql`${votes.createdAt} <= ${tenMinutesAfter}`
      )
    );

  if (uncivilResult && uncivilResult.count >= 5) {
    await db
      .update(comments)
      .set({
        isQuarantined: true,
        quarantineReason:
          "Auto-quarantined: high rate of uncivil flags",
      })
      .where(eq(comments.id, commentId));
    return true;
  }

  // Check 2: New account with 3+ downvotes of any kind within 5 minutes
  if (author.trustTier === "new") {
    const fiveMinutesAfter = new Date(
      commentCreatedAt.getTime() + 5 * 60 * 1000
    );

    const [downvoteResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(votes)
      .where(
        and(
          eq(votes.commentId, commentId),
          eq(votes.direction, "down"),
          sql`${votes.createdAt} <= ${fiveMinutesAfter}`
        )
      );

    if (downvoteResult && downvoteResult.count >= 3) {
      await db
        .update(comments)
        .set({
          isQuarantined: true,
          quarantineReason:
            "Auto-quarantined: new account flagged for review",
        })
        .where(eq(comments.id, commentId));
      return true;
    }
  }

  return false;
}
