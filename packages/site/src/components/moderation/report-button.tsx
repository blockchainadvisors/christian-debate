"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const REPORT_REASONS = [
  { label: "Uncivil", value: "uncivil" },
  { label: "Spam", value: "low_effort" },
  { label: "Off-topic", value: "off_topic" },
  { label: "Misleading", value: "misleading_unsourced" },
] as const;

interface ReportButtonProps {
  commentId: string;
}

export function ReportButton({ commentId }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleReport(reason: string) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/comments/${commentId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction: "down",
          reason,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setOpen(false);
          setSubmitted(false);
        }, 1500);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          aria-label="Report comment"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <line x1="4" x2="4" y1="22" y2="15" />
          </svg>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Comment</DialogTitle>
          <DialogDescription>
            Select a reason for reporting this comment.
          </DialogDescription>
        </DialogHeader>
        {submitted ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Report submitted. Thank you.
          </p>
        ) : (
          <div className="grid gap-2 py-4">
            {REPORT_REASONS.map((reason) => (
              <Button
                key={reason.value}
                variant="outline"
                className="justify-start"
                disabled={submitting}
                onClick={() => handleReport(reason.value)}
              >
                {reason.label}
              </Button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
