"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { getGuestCache, clearGuestCache, hasGuestData, removeSubmittedItems } from "@/lib/guest-cache";
import { previewGuestData, submitGuestData } from "@/lib/guest-auto-submit";
import { GuestConflictDialog } from "./guest-conflict-dialog";
import type { PreviewResponse, ConflictResolutions } from "@/types/guest";

export function GuestAutoSubmitter() {
  const { status } = useSession();
  const initiated = useRef(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitResult = useCallback(
    (
      result: Awaited<ReturnType<typeof submitGuestData>>,
      cache: ReturnType<typeof getGuestCache>
    ) => {
      const total =
        result.submittedComments + result.submittedVotes + result.submittedStances;
      const failed = result.failedLocalIds.length;

      // Determine which items succeeded for selective cache clearing
      const failedSet = new Set(result.failedLocalIds);
      const succeededCommentIds = cache.comments
        .map((c) => c.localId)
        .filter((id) => !failedSet.has(id));
      const succeededVoteIds = cache.votes
        .map((v) => v.localId)
        .filter((id) => !failedSet.has(id));
      // For stances, skipped ones should also be removed from cache
      const skippedStanceSlugs = (cache.stances ?? [])
        .map((s) => s.debateSlug)
        .filter((slug) => !result.errors.some((e) => e.localId === slug));

      removeSubmittedItems(succeededCommentIds, succeededVoteIds, skippedStanceSlugs);

      if (failed === 0 && total > 0) {
        const parts = buildResultParts(result);
        const skippedParts = buildSkippedParts(result);
        let message = `Guest data saved: ${parts.join(", ")}`;
        if (skippedParts.length > 0) {
          message += ` (${skippedParts.join(", ")})`;
        }
        toast.success(message);
      } else if (total > 0 && failed > 0) {
        toast.warning(
          `Saved ${total} of ${total + failed} items. Some items couldn't be saved.`
        );
      } else if (total === 0 && failed > 0) {
        toast.error("Couldn't save guest data. Your items are still cached.");
      } else {
        // All skipped, nothing to report
        clearGuestCache();
      }
    },
    []
  );

  useEffect(() => {
    if (status !== "authenticated" || initiated.current) return;
    if (!hasGuestData()) return;

    initiated.current = true;

    const cache = getGuestCache();

    previewGuestData(cache.comments, cache.votes, cache.stances ?? [])
      .then((result) => {
        if (!result.hasConflicts) {
          // No conflicts — auto-submit everything
          return submitGuestData(cache.comments, cache.votes, cache.stances ?? []).then(
            (submitResult) => {
              handleSubmitResult(submitResult, cache);
            }
          );
        }
        // Has conflicts — show dialog
        setPreview(result);
        setDialogOpen(true);
      })
      .catch(() => {
        toast.error("Couldn't save guest data. Your items are still cached.");
      });
  }, [status, handleSubmitResult]);

  const handleDialogSubmit = useCallback(
    async (resolutions: ConflictResolutions) => {
      setSubmitting(true);
      try {
        const cache = getGuestCache();
        const result = await submitGuestData(
          cache.comments,
          cache.votes,
          cache.stances ?? [],
          resolutions
        );
        setDialogOpen(false);
        handleSubmitResult(result, cache);
      } catch {
        toast.error("Couldn't save guest data. Your items are still cached.");
      } finally {
        setSubmitting(false);
      }
    },
    [handleSubmitResult]
  );

  const handleDiscard = useCallback(() => {
    clearGuestCache();
    setDialogOpen(false);
    toast("Guest data discarded.");
  }, []);

  if (!preview || !dialogOpen) return null;

  return (
    <GuestConflictDialog
      open={dialogOpen}
      preview={preview}
      onSubmit={handleDialogSubmit}
      onDiscard={handleDiscard}
      submitting={submitting}
    />
  );
}

function buildResultParts(result: Awaited<ReturnType<typeof submitGuestData>>): string[] {
  const parts: string[] = [];
  if (result.submittedComments > 0) {
    parts.push(
      `${result.submittedComments} comment${result.submittedComments !== 1 ? "s" : ""}`
    );
  }
  if (result.submittedVotes > 0) {
    parts.push(`${result.submittedVotes} vote${result.submittedVotes !== 1 ? "s" : ""}`);
  }
  if (result.submittedStances > 0) {
    parts.push(
      `${result.submittedStances} stance${result.submittedStances !== 1 ? "s" : ""}`
    );
  }
  return parts;
}

function buildSkippedParts(result: Awaited<ReturnType<typeof submitGuestData>>): string[] {
  const parts: string[] = [];
  if (result.skippedVotes > 0) {
    parts.push(`${result.skippedVotes} vote${result.skippedVotes !== 1 ? "s" : ""} kept`);
  }
  if (result.skippedStances > 0) {
    parts.push(
      `${result.skippedStances} stance${result.skippedStances !== 1 ? "s" : ""} kept`
    );
  }
  if (result.skippedComments > 0) {
    parts.push(
      `${result.skippedComments} duplicate${result.skippedComments !== 1 ? "s" : ""} skipped`
    );
  }
  return parts;
}
