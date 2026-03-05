import type { UpvoteReason, DownvoteReason } from "@/types/votes";

export const UPVOTE_REASONS: UpvoteReason[] = [
  "well_reasoned",
  "well_sourced",
  "changed_my_mind",
  "strong_counterpoint",
  "well_written",
];

export const DOWNVOTE_REASONS: DownvoteReason[] = [
  "off_topic",
  "uncivil",
  "misleading_unsourced",
  "misrepresented_stance",
  "low_effort",
];

const REASON_MULTIPLIERS: Record<string, number> = {
  changed_my_mind: 3,
  well_sourced: 2,
  well_reasoned: 1,
  strong_counterpoint: 1,
  well_written: 1,
  off_topic: -1,
  uncivil: -1,
  misleading_unsourced: -1,
  misrepresented_stance: -1,
  low_effort: -1,
};

export const TRUST_TIER_WEIGHTS: Record<string, number> = {
  new: 0.5,
  established: 1.0,
  trusted: 1.5,
  moderator: 2.0,
  admin: 2.0,
};

export function computeCommentScore(
  votes: { direction: string; reason: string; weight: number }[]
): number {
  let score = 0;
  for (const vote of votes) {
    const reasonMultiplier = REASON_MULTIPLIERS[vote.reason] ?? 1;
    score += reasonMultiplier * vote.weight;
  }
  return Math.round(score);
}
