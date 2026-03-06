"use client";

import { useSyncExternalStore, useCallback } from "react";
import {
  getGuestCache,
  addGuestComment as _addComment,
  addGuestVote as _addVote,
  removeGuestComment as _removeComment,
  removeGuestVote as _removeVote,
  clearGuestCache as _clear,
  hasGuestData as _hasData,
  getGuestCounts as _getCounts,
  subscribeToCacheUpdates,
} from "@/lib/guest-cache";
import type { GuestComment, GuestVote } from "@/types/guest";

function getSnapshot() {
  return getGuestCache();
}

function getServerSnapshot() {
  return { version: 1 as const, comments: [] as GuestComment[], votes: [] as GuestVote[] };
}

export function useGuestCache() {
  const cache = useSyncExternalStore(subscribeToCacheUpdates, getSnapshot, getServerSnapshot);

  const addComment = useCallback(
    (comment: Omit<GuestComment, "localId" | "createdAt">) => _addComment(comment),
    []
  );

  const addVote = useCallback(
    (vote: Omit<GuestVote, "localId" | "createdAt">) => _addVote(vote),
    []
  );

  const removeComment = useCallback((localId: string) => _removeComment(localId), []);
  const removeVote = useCallback((commentId: string) => _removeVote(commentId), []);
  const clear = useCallback(() => _clear(), []);

  return {
    comments: cache.comments,
    votes: cache.votes,
    counts: _getCounts(),
    hasData: _hasData(),
    addComment,
    addVote,
    removeComment,
    removeVote,
    clear,
  };
}
