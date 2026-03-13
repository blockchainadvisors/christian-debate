import { db } from "@/db";
import { comments, promotedComments, users } from "@/db/schema";
import { eq, and, count, sql } from "drizzle-orm";

export const PROMOTION_THRESHOLDS = {
  MIN_DIRECT_REPLIES: 5,
  MIN_SCORE: 10,
} as const;

export async function checkAndPromoteComment(
  commentId: string
): Promise<boolean> {
  // Check if already promoted
  const existing = await db
    .select()
    .from(promotedComments)
    .where(eq(promotedComments.commentId, commentId))
    .limit(1);

  if (existing.length > 0) {
    return false;
  }

  // Count direct replies
  const [replyCount] = await db
    .select({ count: count() })
    .from(comments)
    .where(and(eq(comments.parentId, commentId), eq(comments.status, "active")));

  const directReplies = replyCount?.count ?? 0;

  // Get comment score and author
  const [comment] = await db
    .select({
      score: comments.score,
      authorId: comments.authorId,
      debateId: comments.debateId,
    })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

  if (!comment) {
    return false;
  }

  // Check if thresholds are met
  if (
    directReplies >= PROMOTION_THRESHOLDS.MIN_DIRECT_REPLIES ||
    comment.score >= PROMOTION_THRESHOLDS.MIN_SCORE
  ) {
    // Insert promotion record
    await db.insert(promotedComments).values({
      commentId,
      debateId: comment.debateId,
      authorId: comment.authorId,
      directReplyCount: directReplies,
      scoreAtPromotion: comment.score,
    });

    // Award reputation to author
    await db
      .update(users)
      .set({
        reputationScore: sql`${users.reputationScore} + 10`,
      })
      .where(eq(users.id, comment.authorId));

    return true;
  }

  return false;
}
