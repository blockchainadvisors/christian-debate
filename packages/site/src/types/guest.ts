import type { VoteReason } from "./votes";
import type { StanceSide } from "./stances";

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

export interface GuestStance {
  debateSlug: string;
  debateId: string;
  declaredStance: StanceSide;
  createdAt: string;
}

export interface GuestCache {
  version: 1;
  comments: GuestComment[];
  votes: GuestVote[];
  stances?: GuestStance[];
}

// ─── Conflict Resolution Types ──────────────────────────────────────

export interface VoteConflict {
  localId: string;
  commentId: string;
  commentPreview: string;
  debateTitle: string;
  guestDirection: "up" | "down";
  guestReason: VoteReason;
  existingDirection: "up" | "down";
  existingReason: VoteReason;
}

export interface StanceConflict {
  debateSlug: string;
  debateTitle: string;
  sideALabel: string;
  sideBLabel: string;
  guestStance: StanceSide;
  existingStance: StanceSide;
}

export interface CommentConflict {
  localId: string;
  debateSlug: string;
  debateTitle: string;
  contentPreview: string;
  existingCommentId: string;
}

export interface PreviewResponse {
  conflicts: {
    votes: VoteConflict[];
    stances: StanceConflict[];
    comments: CommentConflict[];
  };
  clean: { comments: number; votes: number; stances: number };
  hasConflicts: boolean;
}

export interface ConflictResolutions {
  votes: Record<string, "keep_existing" | "use_guest" | "skip">;
  stances: Record<string, "keep_existing" | "use_guest" | "skip">;
  comments: Record<string, "submit" | "skip">;
}
