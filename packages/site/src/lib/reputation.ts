import { db } from "@/db";
import { comments, votes } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

const UPVOTE_WEIGHTS: Record<string, number> = {
  well_reasoned: 2,
  well_sourced: 3,
  changed_my_mind: 5,
  strong_counterpoint: 2,
  well_written: 1,
};

export async function computeReputation(
  userId: string
): Promise<{ reputationScore: number; persuasionRating: number }> {
  // Get all votes on this user's comments
  const result = await db
    .select({
      direction: votes.direction,
      reason: votes.reason,
    })
    .from(votes)
    .innerJoin(comments, eq(votes.commentId, comments.id))
    .where(eq(comments.authorId, userId));

  let reputationScore = 0;
  let persuasionRating = 0;

  for (const vote of result) {
    if (vote.direction === "up") {
      const weight = UPVOTE_WEIGHTS[vote.reason] ?? 0;
      reputationScore += weight;
      if (vote.reason === "changed_my_mind") {
        persuasionRating++;
      }
    } else if (vote.direction === "down") {
      reputationScore -= 1;
    }
  }

  return { reputationScore, persuasionRating };
}
