"use client";

import { useSyncExternalStore, useCallback } from "react";
import {
  getGuestCache,
  addGuestComment as _addComment,
  addGuestVote as _addVote,
  removeGuestComment as _removeComment,
  removeGuestVote as _removeVote,
  clearGuestCache as _clear,
  setGuestStance as _setStance,
  subscribeToCacheUpdates,
} from "@/lib/guest-cache";
import type { GuestComment, GuestVote } from "@/types/guest";
import type { StanceSide } from "@/types/stances";

const EMPTY_CACHE: ReturnType<typeof getGuestCache> = {
  version: 1,
  comments: [],
  votes: [],
  stances: [],
};

let cachedSnapshot: ReturnType<typeof getGuestCache> | null = null;
let cachedRaw: string | null = null;

function getSnapshot() {
  try {
    const raw = localStorage.getItem("cd_guest_cache");
    if (raw === cachedRaw && cachedSnapshot) return cachedSnapshot;
    cachedRaw = raw;
    cachedSnapshot = raw ? getGuestCache() : EMPTY_CACHE;
    return cachedSnapshot;
  } catch {
    return EMPTY_CACHE;
  }
}

function getServerSnapshot() {
  return EMPTY_CACHE;
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
  const setStance = useCallback(
    (debateSlug: string, debateId: string, declaredStance: StanceSide) =>
      _setStance(debateSlug, debateId, declaredStance),
    []
  );

  const stances = cache.stances ?? [];
  const counts = { comments: cache.comments.length, votes: cache.votes.length, stances: stances.length };
  const hasData = cache.comments.length > 0 || cache.votes.length > 0 || stances.length > 0;

  return {
    comments: cache.comments,
    votes: cache.votes,
    stances,
    counts,
    hasData,
    addComment,
    addVote,
    removeComment,
    removeVote,
    setStance,
    clear,
  };
}
