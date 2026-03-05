import type { CommentWithAuthor } from "./comments";

export interface VerdictTally {
  sideA: number;
  sideB: number;
  draw: number;
  totalVoters: number;
  verifiedNeutralCount: number;
}

export interface PinnedComment extends CommentWithAuthor {
  pinCount: number;
}

export interface VerdictResponse {
  tally: VerdictTally;
  pinnedComments: PinnedComment[];
}
