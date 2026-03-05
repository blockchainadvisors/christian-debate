import { db } from "@/db";
import { burdenOfProofRequests, votes } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Called after a vote is cast with reason='misleading_unsourced'.
 * Counts misleading_unsourced votes for the comment. If >= 3 and no existing request, creates one.
 */
export async function checkAndCreateBurdenRequest(
  commentId: string
): Promise<void> {
  // Count misleading_unsourced votes for this comment
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(votes)
    .where(
      and(
        eq(votes.commentId, commentId),
        eq(votes.reason, "misleading_unsourced")
      )
    );

  if (!countResult || countResult.count < 3) return;

  // Check if a burden request already exists
  const [existing] = await db
    .select({ id: burdenOfProofRequests.id })
    .from(burdenOfProofRequests)
    .where(eq(burdenOfProofRequests.commentId, commentId))
    .limit(1);

  if (existing) return;

  // Create the burden of proof request
  await db.insert(burdenOfProofRequests).values({
    commentId,
    flagCount: countResult.count,
    status: "pending",
  });
}
