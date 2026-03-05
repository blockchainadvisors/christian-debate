export interface CommentsByStance {
  side_a: number;
  side_b: number;
  neutral: number;
}

export interface VotesByStance {
  side_a_up: number;
  side_b_up: number;
  side_a_down: number;
  side_b_down: number;
}

export interface AlgorithmicLeanResult {
  lean: "side_a" | "side_b" | "neutral" | "mixed";
  confidence: number;
}

export function computeAlgorithmicLean(params: {
  commentsByStance: CommentsByStance;
  votesByStance: VotesByStance;
}): AlgorithmicLeanResult {
  const { commentsByStance, votesByStance } = params;

  // Score for each side = (comments_on_that_side * 2) + (upvotes_for_that_side * 1) - (downvotes_for_that_side * 0.5)
  const sideAScore =
    commentsByStance.side_a * 2 +
    votesByStance.side_a_up * 1 -
    votesByStance.side_a_down * 0.5;

  const sideBScore =
    commentsByStance.side_b * 2 +
    votesByStance.side_b_up * 1 -
    votesByStance.side_b_down * 0.5;

  // Total activity = sum of all scores (include neutral comments contribution)
  const totalActivity = sideAScore + sideBScore + commentsByStance.neutral * 2;

  // Not enough data
  if (totalActivity < 3) {
    return { lean: "neutral", confidence: 0 };
  }

  // Lean score = (sideA_score - sideB_score) / totalActivity → range -1 to +1
  const leanScore = (sideAScore - sideBScore) / totalActivity;
  const absLean = Math.abs(leanScore);

  if (absLean < 0.2) {
    return { lean: "mixed", confidence: absLean };
  }

  const lean = leanScore > 0 ? "side_a" : "side_b";
  return { lean, confidence: absLean };
}
