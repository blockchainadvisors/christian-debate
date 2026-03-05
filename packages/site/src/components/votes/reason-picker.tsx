"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import type { VoteDirection, VoteReason } from "@/types/votes";

const UPVOTE_OPTIONS: { reason: VoteReason; label: string; icon: string }[] = [
  { reason: "well_reasoned", label: "Well Reasoned", icon: "\u{1F9E0}" },
  { reason: "well_sourced", label: "Well Sourced", icon: "\u{1F4DA}" },
  { reason: "changed_my_mind", label: "Changed My Mind", icon: "\u{1F4A1}" },
  { reason: "strong_counterpoint", label: "Strong Counterpoint", icon: "\u{2694}\u{FE0F}" },
  { reason: "well_written", label: "Well Written", icon: "\u{270F}\u{FE0F}" },
];

const DOWNVOTE_OPTIONS: { reason: VoteReason; label: string; icon: string }[] = [
  { reason: "off_topic", label: "Off Topic", icon: "\u{1F6AB}" },
  { reason: "uncivil", label: "Uncivil", icon: "\u{26A0}\u{FE0F}" },
  { reason: "misleading_unsourced", label: "Misleading/Unsourced", icon: "\u{2753}" },
  { reason: "misrepresented_stance", label: "Misrepresented Stance", icon: "\u{1F500}" },
  { reason: "low_effort", label: "Low Effort", icon: "\u{1F44E}" },
];

interface ReasonPickerProps {
  direction: VoteDirection;
  commentId: string;
  onVoted: (direction: VoteDirection, reason: VoteReason) => void;
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
      const res = await fetch(`/api/comments/${commentId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction, reason }),
      });

      if (res.ok) {
        onVoted(direction, reason);
      }
    } finally {
      setIsSubmitting(false);
      onOpenChange(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="flex flex-col gap-1">
          <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
            {direction === "up" ? "Why upvote?" : "Why downvote?"}
          </p>
          {options.map((option) => (
            <Button
              key={option.reason}
              variant="ghost"
              size="sm"
              className="justify-start gap-2 text-sm"
              disabled={isSubmitting}
              onClick={() => handleSelect(option.reason)}
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
