import type { VoteReason } from "./votes";

export interface GuestComment {
  localId: string;
  debateSlug: string;
  debateId: string;
  parentId: string | null;
  content: string;
  stanceSide: "side_a" | "side_b" | "neutral" | "meta";
  createdAt: string;
}

export interface GuestVote {
  localId: string;
  commentId: string;
  direction: "up" | "down";
  reason: VoteReason;
  createdAt: string;
}

export interface GuestCache {
  version: 1;
  comments: GuestComment[];
  votes: GuestVote[];
}
