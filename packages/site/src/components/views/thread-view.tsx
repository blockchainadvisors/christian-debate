"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { CommentTree } from "@/components/comments/comment-tree";
import { CommentEditor } from "@/components/comments/comment-editor";
import { StanceDeclaration } from "@/components/stances/stance-declaration";
import { StanceSummary } from "@/components/stances/stance-summary";
import { useGuestCache } from "@/hooks/use-guest-cache";
import { getGuestStanceForDebate } from "@/lib/guest-cache";
import type { CommentWithAuthor } from "@/types/comments";
import type { StanceSummary as StanceSummaryType, StanceSide } from "@/types/stances";

interface Debate {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sideALabel: string;
  sideBLabel: string;
  status: string;
  tags: string[] | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ThreadViewProps {
  debate: Debate;
}

export function ThreadView({ debate }: ThreadViewProps) {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const { status } = useSession();
  const isGuest = status !== "authenticated";
  const [serverComments, setServerComments] = useState<CommentWithAuthor[]>([]);
  const [promotedIds, setPromotedIds] = useState<Set<string>>(new Set());
  const [stanceSummary, setStanceSummary] = useState<StanceSummaryType | null>(null);
  const [currentStance, setCurrentStance] = useState<StanceSide | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const { comments: guestComments, setStance } = useGuestCache();

  // Merge server comments with guest comments for this debate
  const comments = useMemo(() => {
    const debateGuestComments = guestComments.filter(
      (gc) => gc.debateSlug === debate.slug
    );
    if (debateGuestComments.length === 0) return serverComments;

    const guestAsComments: CommentWithAuthor[] = debateGuestComments.map((gc) => ({
      id: gc.localId,
      debateId: gc.debateId,
      authorId: "guest",
      parentId: gc.parentId,
      rootId: null,
      depth: 0,
      content: gc.content,
      stanceSide: gc.stanceSide,
      ancestorPath: null,
      isQuarantined: false,
      quarantineReason: null,
      status: "active" as const,
      score: 0,
      createdAt: gc.createdAt,
      editedAt: null,
      author: {
        id: "guest",
        displayName: "You (Guest)",
        username: "guest",
        avatarUrl: null,
      },
    }));

    return [...serverComments, ...guestAsComments];
  }, [serverComments, guestComments, debate.slug, debate.id]);

  const fetchPromoted = useCallback(async () => {
    try {
      const res = await fetch(`/api/debates/${debate.slug}/promoted`);
      if (res.ok) {
        const ids: string[] = await res.json();
        setPromotedIds(new Set(ids));
      }
    } catch {
      // silently fail
    }
  }, [debate.slug]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/debates/${debate.slug}/comments`);
      if (res.ok) {
        const data = await res.json();
        setServerComments(data);
      }
    } catch {
      // silently fail — comments will remain empty
    }
  }, [debate.slug]);

  const fetchStances = useCallback(async () => {
    try {
      const res = await fetch(`/api/debates/${debate.slug}/stances`);
      if (res.ok) {
        const data = await res.json();
        setStanceSummary(data.summary);
      }
    } catch {
      // silently fail
    }
  }, [debate.slug]);

  const fetchMyStance = useCallback(async () => {
    if (isGuest) {
      // Check guest cache for saved stance
      const guestStance = getGuestStanceForDebate(debate.slug);
      setCurrentStance(guestStance?.declaredStance ?? null);
      return;
    }
    try {
      const res = await fetch(`/api/debates/${debate.slug}/stances/me`);
      if (res.ok) {
        const data = await res.json();
        setCurrentStance(data.declaredStance ?? null);
      } else if (res.status === 401) {
        // Not authenticated
        setCurrentStance(null);
      } else {
        setCurrentStance(null);
      }
    } catch {
      setCurrentStance(null);
    }
  }, [debate.slug, isGuest]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchComments(), fetchStances(), fetchMyStance(), fetchPromoted()]);
      setIsLoading(false);
    };
    load();
  }, [fetchComments, fetchStances, fetchMyStance, fetchPromoted]);

  const handleCommentAdded = useCallback(() => {
    fetchComments();
    fetchStances();
    fetchPromoted();
  }, [fetchComments, fetchStances, fetchPromoted]);

  const isOpen = debate.status === "open";

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
        <div className="h-8 animate-pulse rounded-full bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stance Declaration */}
      {isOpen && currentStance !== undefined && (
        <StanceDeclaration
          debateSlug={debate.slug}
          debateId={debate.id}
          sideALabel={debate.sideALabel}
          sideBLabel={debate.sideBLabel}
          currentStance={currentStance}
          isGuest={isGuest}
          onGuestStance={(stance) => setStance(debate.slug, debate.id, stance)}
        />
      )}

      {/* Stance Summary Bar */}
      {stanceSummary && (
        <StanceSummary
          summary={stanceSummary}
          sideALabel={debate.sideALabel}
          sideBLabel={debate.sideBLabel}
        />
      )}

      {/* Top-level Comment Editor */}
      {isOpen && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Add your comment
          </h3>
          <CommentEditor
            debateId={debate.id}
            debateSlug={debate.slug}
            sideALabel={debate.sideALabel}
            sideBLabel={debate.sideBLabel}
            onSubmit={handleCommentAdded}
          />
        </div>
      )}

      {/* Comment Tree */}
      <CommentTree
        comments={comments}
        debate={{
          id: debate.id,
          slug: debate.slug,
          sideALabel: debate.sideALabel,
          sideBLabel: debate.sideBLabel,
        }}
        onCommentAdded={handleCommentAdded}
        highlightId={highlightId}
        promotedIds={promotedIds}
      />
    </div>
  );
}
