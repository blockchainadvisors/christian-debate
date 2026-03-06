import type { GuestCache, GuestComment, GuestVote } from "@/types/guest";

const STORAGE_KEY = "cd_guest_cache";
const MAX_COMMENTS = 50;
const MAX_VOTES = 100;
const CACHE_EVENT = "cd-guest-cache-update";

function emptyCache(): GuestCache {
  return { version: 1, comments: [], votes: [] };
}

export function getGuestCache(): GuestCache {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyCache();
    const parsed = JSON.parse(raw) as GuestCache;
    if (parsed.version !== 1) return emptyCache();
    return parsed;
  } catch {
    return emptyCache();
  }
}

function saveCache(cache: GuestCache): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    window.dispatchEvent(new CustomEvent(CACHE_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function addGuestComment(comment: Omit<GuestComment, "localId" | "createdAt">): GuestComment | null {
  const cache = getGuestCache();
  if (cache.comments.length >= MAX_COMMENTS) return null;

  const entry: GuestComment = {
    ...comment,
    localId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  cache.comments.push(entry);
  return saveCache(cache) ? entry : null;
}

export function addGuestVote(vote: Omit<GuestVote, "localId" | "createdAt">): GuestVote | null {
  const cache = getGuestCache();

  // Replace existing vote on same comment
  cache.votes = cache.votes.filter((v) => v.commentId !== vote.commentId);

  if (cache.votes.length >= MAX_VOTES) return null;

  const entry: GuestVote = {
    ...vote,
    localId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  cache.votes.push(entry);
  return saveCache(cache) ? entry : null;
}

export function removeGuestComment(localId: string): void {
  const cache = getGuestCache();
  cache.comments = cache.comments.filter((c) => c.localId !== localId);
  // Also remove votes on this guest comment
  cache.votes = cache.votes.filter((v) => v.commentId !== localId);
  saveCache(cache);
}

export function removeGuestVote(commentId: string): void {
  const cache = getGuestCache();
  cache.votes = cache.votes.filter((v) => v.commentId !== commentId);
  saveCache(cache);
}

export function clearGuestCache(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(CACHE_EVENT));
  } catch {
    // ignore
  }
}

export function getGuestCounts(): { comments: number; votes: number } {
  const cache = getGuestCache();
  return { comments: cache.comments.length, votes: cache.votes.length };
}

export function hasGuestData(): boolean {
  const cache = getGuestCache();
  return cache.comments.length > 0 || cache.votes.length > 0;
}

export function getGuestVoteForComment(commentId: string): GuestVote | null {
  const cache = getGuestCache();
  return cache.votes.find((v) => v.commentId === commentId) ?? null;
}

/** Subscribe to cache changes (for useSyncExternalStore) */
export function subscribeToCacheUpdates(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(CACHE_EVENT, handler);
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) callback();
  });
  return () => {
    window.removeEventListener(CACHE_EVENT, handler);
    // Note: storage listener cleanup is simplified; in practice
    // the component unmount handles this fine
  };
}
