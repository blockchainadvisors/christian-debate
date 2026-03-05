"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ReasonPicker } from "@/components/votes/reason-picker";
import type {
  VoteDirection,
  VoteReason,
  UserVote,
  VoteBreakdown,
} from "@/types/votes";
import { cn } from "@/lib/utils";

interface VoteButtonProps {
  commentId: string;
  initialScore: number;
  initialUserVote?: UserVote;
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

  const handleUpClick = useCallback(async () => {
    if (userVote?.direction === "up") {
      // Toggle off - remove vote
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
      // Toggle off - remove vote
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
    (direction: VoteDirection, reason: VoteReason) => {
      setUserVote({ direction, reason });
      // Refetch score
      fetch(`/api/comments/${commentId}/votes`)
        .then((res) => res.json())
        .then((data) => {
          setScore(data.breakdown.totalScore);
        });
    },
    [commentId]
  );

  return (
    <div className="flex items-center gap-1">
      <ReasonPicker
        direction="up"
        commentId={commentId}
        onVoted={handleVoted}
        open={upPickerOpen}
        onOpenChange={setUpPickerOpen}
        trigger={
          <Button
            variant="ghost"
            size="icon-xs"
            className={cn(
              "rounded-full min-h-[44px] min-w-[44px]",
              userVote?.direction === "up" &&
                "bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
            )}
            onClick={(e) => {
              if (userVote?.direction === "up") {
                e.preventDefault();
                handleUpClick();
              }
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </Button>
        }
      />

      <span
        className={cn(
          "min-w-[2ch] text-center text-sm font-semibold tabular-nums",
          score > 0 && "text-green-700 dark:text-green-400",
          score < 0 && "text-red-700 dark:text-red-400"
        )}
      >
        {score}
      </span>

      <ReasonPicker
        direction="down"
        commentId={commentId}
        onVoted={handleVoted}
        open={downPickerOpen}
        onOpenChange={setDownPickerOpen}
        trigger={
          <Button
            variant="ghost"
            size="icon-xs"
            className={cn(
              "rounded-full min-h-[44px] min-w-[44px]",
              userVote?.direction === "down" &&
                "bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
            )}
            onClick={(e) => {
              if (userVote?.direction === "down") {
                e.preventDefault();
                handleDownClick();
              }
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </Button>
        }
      />
    </div>
  );
}
