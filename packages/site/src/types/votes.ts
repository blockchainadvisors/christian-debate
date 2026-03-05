export type VoteDirection = "up" | "down";

export type UpvoteReason =
  | "well_reasoned"
  | "well_sourced"
  | "changed_my_mind"
  | "strong_counterpoint"
  | "well_written";

export type DownvoteReason =
  | "off_topic"
  | "uncivil"
  | "misleading_unsourced"
  | "misrepresented_stance"
  | "low_effort";

export type VoteReason = UpvoteReason | DownvoteReason;

export type VoteBreakdown = {
  up: Record<string, number>;
  down: Record<string, number>;
  totalScore: number;
};

export type UserVote = {
  direction: VoteDirection;
  reason: VoteReason;
} | null;

export type VoteResponse = {
  breakdown: VoteBreakdown;
  userVote: UserVote;
};
