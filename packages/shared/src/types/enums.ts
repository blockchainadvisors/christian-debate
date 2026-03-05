export const TRUST_TIERS = ["new", "established", "trusted", "moderator", "admin"] as const;
export type TrustTier = (typeof TRUST_TIERS)[number];

export const DEBATE_STATUSES = ["open", "locked", "archived"] as const;
export type DebateStatus = (typeof DEBATE_STATUSES)[number];

export const STANCE_SIDES = ["side_a", "side_b", "neutral"] as const;
export type StanceSide = (typeof STANCE_SIDES)[number];

export const COMMENT_STANCE_SIDES = ["side_a", "side_b", "neutral", "meta"] as const;
export type CommentStanceSide = (typeof COMMENT_STANCE_SIDES)[number];

export const ALGORITHMIC_LEANS = ["side_a", "side_b", "neutral", "mixed"] as const;
export type AlgorithmicLean = (typeof ALGORITHMIC_LEANS)[number];

export const VOTE_DIRECTIONS = ["up", "down"] as const;
export type VoteDirection = (typeof VOTE_DIRECTIONS)[number];

export const UPVOTE_REASONS = [
  "well_reasoned",
  "well_sourced",
  "changed_my_mind",
  "strong_counterpoint",
  "well_written",
] as const;
export type UpvoteReason = (typeof UPVOTE_REASONS)[number];

export const DOWNVOTE_REASONS = [
  "off_topic",
  "uncivil",
  "misleading_unsourced",
  "misrepresented_stance",
  "low_effort",
] as const;
export type DownvoteReason = (typeof DOWNVOTE_REASONS)[number];

export const VOTE_REASONS = [...UPVOTE_REASONS, ...DOWNVOTE_REASONS] as const;
export type VoteReason = (typeof VOTE_REASONS)[number];

export const COMMENT_STATUSES = [
  "active",
  "edited",
  "deleted_by_author",
  "removed_by_mod",
] as const;
export type CommentStatus = (typeof COMMENT_STATUSES)[number];

export const VERDICT_SIDES = ["side_a", "side_b", "draw"] as const;
export type VerdictSide = (typeof VERDICT_SIDES)[number];

export const ARGUMENT_TAXONOMIES = [
  "empirical",
  "moral_ethical",
  "economic",
  "procedural",
  "anecdotal",
  "legal",
  "historical",
] as const;
export type ArgumentTaxonomy = (typeof ARGUMENT_TAXONOMIES)[number];

export const BURDEN_OF_PROOF_STATUSES = [
  "pending",
  "citation_provided",
  "upheld",
  "dismissed",
] as const;
export type BurdenOfProofStatus = (typeof BURDEN_OF_PROOF_STATUSES)[number];

export const PROFILE_VISIBILITY = ["public", "linked_sites_only", "private"] as const;
export type ProfileVisibility = (typeof PROFILE_VISIBILITY)[number];
