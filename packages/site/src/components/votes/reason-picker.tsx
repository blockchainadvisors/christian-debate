"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { VoteDirection, VoteReason } from "@/types/votes";
import { cn } from "@/lib/utils";

const UPVOTE_OPTIONS: { reason: VoteReason; label: string; icon: string; hint: string }[] = [
  { reason: "well_reasoned", label: "Well Reasoned", icon: "\u{1F9E0}", hint: "Clear, logical argument" },
  { reason: "well_sourced", label: "Well Sourced", icon: "\u{1F4DA}", hint: "Backed by evidence" },
  { reason: "changed_my_mind", label: "Changed My Mind", icon: "\u{1F4A1}", hint: "Genuinely persuasive" },
  { reason: "strong_counterpoint", label: "Strong Counterpoint", icon: "\u{2694}\u{FE0F}", hint: "Effective rebuttal" },
  { reason: "well_written", label: "Well Written", icon: "\u{270F}\u{FE0F}", hint: "Eloquent & clear" },
];

const DOWNVOTE_OPTIONS: { reason: VoteReason; label: string; icon: string; hint: string }[] = [
  { reason: "off_topic", label: "Off Topic", icon: "\u{1F6AB}", hint: "Doesn't address the debate" },
  { reason: "uncivil", label: "Uncivil", icon: "\u{26A0}\u{FE0F}", hint: "Disrespectful tone" },
  { reason: "misleading_unsourced", label: "Misleading/Unsourced", icon: "\u{2753}", hint: "Unsubstantiated claims" },
  { reason: "misrepresented_stance", label: "Misrepresented Stance", icon: "\u{1F500}", hint: "Strawman argument" },
  { reason: "low_effort", label: "Low Effort", icon: "\u{1F44E}", hint: "Lacks substance" },
];

interface ReasonPickerProps {
  direction: VoteDirection;
  commentId: string;
  onVoted: (direction: VoteDirection, reason: VoteReason, newScore: number) => void;
  trigger: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReasonPicker({
  direction,
  commentId,
  onVoted,
  trigger,
  open,
  onOpenChange,
}: ReasonPickerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const options = direction === "up" ? UPVOTE_OPTIONS : DOWNVOTE_OPTIONS;

  async function handleSelect(reason: VoteReason) {
    setIsSubmitting(true);
    try {
      let res = await fetch(`/api/comments/${commentId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction, reason }),
      });

      // Dev server may 404 on first compile -- retry once
      if (res.status === 404) {
        await new Promise((r) => setTimeout(r, 500));
        res = await fetch(`/api/comments/${commentId}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ direction, reason }),
        });
      }

      if (res.ok) {
        const data = await res.json();
        onVoted(direction, reason, data.breakdown.totalScore);
      } else if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
    } finally {
      setIsSubmitting(false);
      onOpenChange(false);
    }
  }

  const isUp = direction === "up";

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-64 p-0 overflow-hidden" align="start" sideOffset={8}>
        {/* Header bar with directional color accent */}
        <div
          className={cn(
            "px-3 py-2 text-xs font-semibold tracking-wide uppercase",
            isUp
              ? "bg-emerald-500/10 text-emerald-700 border-b border-emerald-500/15 dark:bg-emerald-400/10 dark:text-emerald-400 dark:border-emerald-400/15"
              : "bg-rose-500/10 text-rose-700 border-b border-rose-500/15 dark:bg-rose-400/10 dark:text-rose-400 dark:border-rose-400/15"
          )}
        >
          {isUp ? "Why upvote?" : "Why downvote?"}
        </div>

        {/* Options */}
        <div className="p-1.5 flex flex-col gap-0.5">
          {options.map((option) => (
            <button
              key={option.reason}
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSelect(option.reason)}
              className={cn(
                "flex items-start gap-2.5 w-full px-2.5 py-2 rounded-md text-left",
                "transition-colors duration-150",
                "hover:bg-accent/80 active:bg-accent",
                "disabled:opacity-50 disabled:pointer-events-none",
                "cursor-pointer"
              )}
            >
              <span className="text-base leading-5 shrink-0 mt-px">{option.icon}</span>
              <div className="min-w-0">
                <div className="text-sm font-medium leading-5">{option.label}</div>
                <div className="text-[11px] leading-4 text-muted-foreground/70">{option.hint}</div>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
