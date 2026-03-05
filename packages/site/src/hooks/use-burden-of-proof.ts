"use client";

import { useState, useEffect, useCallback } from "react";

interface BurdenOfProofRequest {
  id: string;
  commentId: string;
  flagCount: number;
  status: "pending" | "citation_provided" | "upheld" | "dismissed";
  citationUrl: string | null;
  citationUpvotes: number;
  createdAt: string;
  resolvedAt: string | null;
}

export function useBurdenOfProof(commentId: string) {
  const [burdenRequest, setBurdenRequest] =
    useState<BurdenOfProofRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBurdenRequest = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/comments/${commentId}/burden-of-proof`);
      if (res.ok) {
        const data = await res.json();
        setBurdenRequest(data);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, [commentId]);

  useEffect(() => {
    fetchBurdenRequest();
  }, [fetchBurdenRequest]);

  const submitCitation = useCallback(
    async (url: string) => {
      const res = await fetch(`/api/comments/${commentId}/burden-of-proof`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citationUrl: url }),
      });

      if (res.ok) {
        const data = await res.json();
        setBurdenRequest(data);
        return data;
      }

      const error = await res.json();
      throw new Error(error.error || "Failed to submit citation");
    },
    [commentId]
  );

  const upvoteCitation = useCallback(async () => {
    const res = await fetch(
      `/api/comments/${commentId}/burden-of-proof/upvote`,
      { method: "POST" }
    );

    if (res.ok) {
      const data = await res.json();
      setBurdenRequest(data);
      return data;
    }

    const error = await res.json();
    throw new Error(error.error || "Failed to upvote citation");
  }, [commentId]);

  return { burdenRequest, isLoading, submitCitation, upvoteCitation };
}
