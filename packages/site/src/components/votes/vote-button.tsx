"use client";

import { useState, useEffect, useCallback } from "react";
import { ReasonPicker } from "@/components/votes/reason-picker";
import type {
  VoteDirection,
  VoteReason,
  UserVote,
} from "@/types/votes";
import { cn } from "@/lib/utils";

interface VoteButtonProps {
  commentId: string;
  initialScore: number;
  initialUserVote?: UserVote;
}

function VoteArrow({
  direction,
  active,
}: {
  direction: "up" | "down";
  active: boolean;
}) {
  // Bold, filled arrow — chunky and intentional, like a stamp of approval
  const d =
    direction === "up"
      ? "M12 4L4.5 14h4v5h7v-5h4L12 4z"
      : "M12 20l7.5-10h-4V5h-7v5h-4L12 20z";

  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(
        "size-4 transition-all duration-200",
        active && "drop-shadow-[0_0_4px_currentColor]"
      )}
      aria-hidden="true"
    >
      <path
        d={d}
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={active ? 1 : 1.5}
        strokeLinejoin="round"
        className="transition-all duration-200"
      />
    </svg>
  );
}

export function VoteButton({
  commentId,
  initialScore,
  initialUserVote,
}: VoteButtonProps) {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<UserVote>(initialUserVote ?? null);
  const [upPickerOpen, setUpPickerOpen] = useState(false);
  const [downPickerOpen, setDownPickerOpen] = useState(false);
  const [popDirection, setPopDirection] = useState<"up" | "down" | null>(null);

  // Fetch the user's existing vote on mount
  useEffect(() => {
    fetch(`/api/comments/${commentId}/votes`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.userVote) {
          setUserVote(data.userVote);
        }
      })
      .catch(() => {});
  }, [commentId]);

  const handleUpClick = useCallback(async () => {
    if (userVote?.direction === "up") {
      const res = await fetch(`/api/comments/${commentId}/vote`, {
        method: "DELETE",
      });
      if (res.ok) {
        const data = await res.json();
        setScore(data.breakdown.totalScore);
        setUserVote(null);
      }
    } else {
      setUpPickerOpen(true);
    }
  }, [userVote, commentId]);

  const handleDownClick = useCallback(async () => {
    if (userVote?.direction === "down") {
      const res = await fetch(`/api/comments/${commentId}/vote`, {
        method: "DELETE",
      });
      if (res.ok) {
        const data = await res.json();
        setScore(data.breakdown.totalScore);
        setUserVote(null);
      }
    } else {
      setDownPickerOpen(true);
    }
  }, [userVote, commentId]);

  const handleVoted = useCallback(
    (direction: VoteDirection, reason: VoteReason, newScore: number) => {
      setUserVote({ direction, reason });
      setScore(newScore);
      // Trigger pop animation
      setPopDirection(direction);
      setTimeout(() => setPopDirection(null), 400);
    },
    []
  );

  const isUpActive = userVote?.direction === "up";
  const isDownActive = userVote?.direction === "down";

  return (
    <div className="vote-controls flex items-center rounded-full border border-transparent hover:border-border/50 transition-colors duration-200">
      {/* Upvote */}
      <ReasonPicker
        direction="up"
        commentId={commentId}
        onVoted={handleVoted}
        open={upPickerOpen}
        onOpenChange={setUpPickerOpen}
        trigger={
          <button
            type="button"
            data-vote-direction="up"
            data-vote-active={isUpActive ? "true" : undefined}
            className={cn(
              "relative flex items-center justify-center",
              "size-9 rounded-full",
              "transition-all duration-200 ease-out",
              "cursor-pointer select-none",
              "hover:scale-110 active:scale-95",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isUpActive
                ? "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400"
                : "text-muted-foreground/60 hover:text-emerald-600/80 hover:bg-emerald-500/8 dark:hover:text-emerald-400/80 dark:hover:bg-emerald-400/8",
              popDirection === "up" && "animate-[vote-pop_350ms_ease-out]"
            )}
            onClick={(e) => {
              if (isUpActive) {
                e.preventDefault();
                handleUpClick();
              }
            }}
          >
            <VoteArrow direction="up" active={isUpActive} />
          </button>
        }
      />

      {/* Score */}
      <span
        className={cn(
          "min-w-[2.5ch] text-center text-[13px] font-bold tabular-nums leading-none",
          "transition-colors duration-300",
          "select-none",
          score > 0 && "text-emerald-600 dark:text-emerald-400",
          score < 0 && "text-rose-600 dark:text-rose-400",
          score === 0 && "text-muted-foreground/70"
        )}
      >
        {score}
      </span>

      {/* Downvote */}
      <ReasonPicker
        direction="down"
        commentId={commentId}
        onVoted={handleVoted}
        open={downPickerOpen}
        onOpenChange={setDownPickerOpen}
        trigger={
          <button
            type="button"
            data-vote-direction="down"
            data-vote-active={isDownActive ? "true" : undefined}
            className={cn(
              "relative flex items-center justify-center",
              "size-9 rounded-full",
              "transition-all duration-200 ease-out",
              "cursor-pointer select-none",
              "hover:scale-110 active:scale-95",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isDownActive
                ? "bg-rose-500/15 text-rose-600 dark:bg-rose-400/15 dark:text-rose-400"
                : "text-muted-foreground/60 hover:text-rose-600/80 hover:bg-rose-500/8 dark:hover:text-rose-400/80 dark:hover:bg-rose-400/8",
              popDirection === "down" && "animate-[vote-pop_350ms_ease-out]"
            )}
            onClick={(e) => {
              if (isDownActive) {
                e.preventDefault();
                handleDownClick();
              }
            }}
          >
            <VoteArrow direction="down" active={isDownActive} />
          </button>
        }
      />
    </div>
  );
}
