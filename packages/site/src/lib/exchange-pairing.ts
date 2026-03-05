import type { CommentWithAuthor } from "@/types/comments";
import type { ExchangePair } from "@/types/exchanges";

/**
 * Computes the value at the given percentile for an array of numbers.
 * Uses linear interpolation between closest ranks.
 */
function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0];
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function areOpposing(
  a: CommentWithAuthor["stanceSide"],
  b: CommentWithAuthor["stanceSide"]
): boolean {
  return (
    (a === "side_a" && b === "side_b") || (a === "side_b" && b === "side_a")
  );
}

function computePairScore(scores: number[]): number {
  if (scores.length < 2) return 0;
  const sorted = [...scores].sort((a, b) => a - b);
  // min * 2 + max — favors balanced exchanges
  return sorted[0] * 2 + sorted[sorted.length - 1];
}

/**
 * Finds the best exchanges in a debate: high-quality opposing reply pairs/chains.
 */
export function findBestExchanges(
  comments: CommentWithAuthor[]
): ExchangePair[] {
  if (comments.length === 0) return [];

  // Build lookup maps
  const byId = new Map<string, CommentWithAuthor>();
  const childrenOf = new Map<string, CommentWithAuthor[]>();

  for (const c of comments) {
    byId.set(c.id, c);
    if (c.parentId) {
      const siblings = childrenOf.get(c.parentId) ?? [];
      siblings.push(c);
      childrenOf.set(c.parentId, siblings);
    }
  }

  // Compute 75th percentile score threshold
  const allScores = comments.map((c) => c.score);
  const threshold = Math.max(percentile(allScores, 75), 1);

  const exchanges: ExchangePair[] = [];
  const usedInChain = new Set<string>();

  // Find pairs: B is a direct reply to A with opposing stance, both above threshold
  for (const commentA of comments) {
    if (commentA.score < threshold) continue;
    if (
      commentA.stanceSide !== "side_a" &&
      commentA.stanceSide !== "side_b"
    )
      continue;

    const replies = childrenOf.get(commentA.id) ?? [];
    for (const commentB of replies) {
      if (commentB.score < threshold) continue;
      if (!areOpposing(commentA.stanceSide, commentB.stanceSide)) continue;

      // Check for chain extension: C replies to B with opposing stance
      const chain: CommentWithAuthor[] = [commentA, commentB];
      const repliesOfB = childrenOf.get(commentB.id) ?? [];
      let bestC: CommentWithAuthor | null = null;
      let bestCScore = -1;

      for (const commentC of repliesOfB) {
        if (commentC.score < threshold) continue;
        if (!areOpposing(commentB.stanceSide, commentC.stanceSide)) continue;
        if (commentC.score > bestCScore) {
          bestC = commentC;
          bestCScore = commentC.score;
        }
      }

      if (bestC) {
        chain.push(bestC);
      }

      const scores = chain.map((c) => c.score);
      const pairScore = computePairScore(scores);
      const id = chain.map((c) => c.id).join("-");

      exchanges.push({ id, comments: chain, pairScore });
    }
  }

  // Sort by pair score descending
  exchanges.sort((a, b) => b.pairScore - a.pairScore);

  // Return top 20
  return exchanges.slice(0, 20);
}
