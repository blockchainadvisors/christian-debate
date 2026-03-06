"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { getGuestCache, clearGuestCache, hasGuestData } from "@/lib/guest-cache";
import { submitGuestData } from "@/lib/guest-auto-submit";

export function GuestAutoSubmitter() {
  const { status } = useSession();
  const submitted = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || submitted.current) return;
    if (!hasGuestData()) return;

    submitted.current = true;

    const cache = getGuestCache();

    submitGuestData(cache.comments, cache.votes, cache.stances ?? [])
      .then((result) => {
        clearGuestCache();

        const parts: string[] = [];
        if (result.submittedComments > 0) {
          parts.push(`${result.submittedComments} comment${result.submittedComments !== 1 ? "s" : ""}`);
        }
        if (result.submittedVotes > 0) {
          parts.push(`${result.submittedVotes} vote${result.submittedVotes !== 1 ? "s" : ""}`);
        }
        if (result.submittedStances > 0) {
          parts.push(`${result.submittedStances} stance${result.submittedStances !== 1 ? "s" : ""}`);
        }

        if (parts.length > 0) {
          // Simple notification — could be replaced with a toast library
          console.log(`Guest data submitted: ${parts.join(" and ")}`);
        }
        if (result.errors.length > 0) {
          console.warn("Some guest items failed to submit:", result.errors);
        }
      })
      .catch((err) => {
        console.error("Failed to submit guest data:", err);
      });
  }, [status]);

  return null;
}
