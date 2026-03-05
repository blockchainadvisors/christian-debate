"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { StanceSide } from "@/types/stances";

interface StanceDeclarationProps {
  debateSlug: string;
  sideALabel: string;
  sideBLabel: string;
  currentStance?: StanceSide | null;
}

const stanceOptions: { value: StanceSide; colorClass: string }[] = [
  {
    value: "side_a",
    colorClass:
      "border-blue-300 bg-blue-50 text-blue-900 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-100 dark:hover:bg-blue-900",
  },
  {
    value: "side_b",
    colorClass:
      "border-red-300 bg-red-50 text-red-900 hover:bg-red-100 dark:border-red-700 dark:bg-red-950 dark:text-red-100 dark:hover:bg-red-900",
  },
  {
    value: "neutral",
    colorClass:
      "border-gray-300 bg-gray-50 text-gray-900 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
  },
];

const selectedStyles: Record<StanceSide, string> = {
  side_a:
    "ring-2 ring-blue-500 bg-blue-100 dark:bg-blue-900 dark:ring-blue-400",
  side_b: "ring-2 ring-red-500 bg-red-100 dark:bg-red-900 dark:ring-red-400",
  neutral:
    "ring-2 ring-gray-500 bg-gray-200 dark:bg-gray-700 dark:ring-gray-400",
};

function getLabel(
  value: StanceSide,
  sideALabel: string,
  sideBLabel: string
): string {
  if (value === "side_a") return sideALabel;
  if (value === "side_b") return sideBLabel;
  return "Neutral";
}

export function StanceDeclaration({
  debateSlug,
  sideALabel,
  sideBLabel,
  currentStance: initialStance,
}: StanceDeclarationProps) {
  const [currentStance, setCurrentStance] = useState<StanceSide | null>(
    initialStance ?? null
  );
  const [pendingStance, setPendingStance] = useState<StanceSide | null>(null);
  const [showChangeDialog, setShowChangeDialog] = useState(false);
  const [note, setNote] = useState("");
  const [triggeredByCommentId, setTriggeredByCommentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelect = useCallback(
    (stance: StanceSide) => {
      if (stance === currentStance) return;

      if (currentStance) {
        // Changing stance — show confirmation
        setPendingStance(stance);
        setNote("");
        setTriggeredByCommentId("");
        setShowChangeDialog(true);
      } else {
        // First declaration — submit directly
        submitStance(stance);
      }
    },
    [currentStance]
  );

  const submitStance = async (
    stance: StanceSide,
    options?: { note?: string; triggeredByCommentId?: string }
  ) => {
    const previousStance = currentStance;
    // Optimistic update
    setCurrentStance(stance);
    setIsSubmitting(true);

    try {
      const body: Record<string, string> = { declaredStance: stance };
      if (options?.note) body.note = options.note;
      if (options?.triggeredByCommentId)
        body.triggeredByCommentId = options.triggeredByCommentId;

      const res = await fetch(`/api/debates/${debateSlug}/stances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        // Revert on failure
        setCurrentStance(previousStance);
      }
    } catch {
      // Revert on error
      setCurrentStance(previousStance);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmChange = () => {
    if (!pendingStance) return;
    setShowChangeDialog(false);
    submitStance(pendingStance, {
      note: note || undefined,
      triggeredByCommentId: triggeredByCommentId || undefined,
    });
    setPendingStance(null);
  };

  const handleCancelChange = () => {
    setShowChangeDialog(false);
    setPendingStance(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your Stance</CardTitle>
          <CardDescription>
            {currentStance
              ? "You can change your stance at any time."
              : "Declare where you stand on this debate."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            {stanceOptions.map((option) => {
              const isSelected = currentStance === option.value;
              return (
                <Button
                  key={option.value}
                  variant="outline"
                  disabled={isSubmitting}
                  className={cn(
                    "min-w-0 flex-1 border-2 py-3 font-medium transition-all whitespace-normal h-auto text-center",
                    option.colorClass,
                    isSelected && selectedStyles[option.value]
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  {getLabel(option.value, sideALabel, sideBLabel)}
                  {isSelected && " (current)"}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showChangeDialog} onOpenChange={setShowChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Your Stance</DialogTitle>
            <DialogDescription>
              You are changing from{" "}
              <strong>
                {currentStance
                  ? getLabel(currentStance, sideALabel, sideBLabel)
                  : ""}
              </strong>{" "}
              to{" "}
              <strong>
                {pendingStance
                  ? getLabel(pendingStance, sideALabel, sideBLabel)
                  : ""}
              </strong>
              . This change will be recorded.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="stance-note">
                Why are you changing? (optional)
              </Label>
              <textarea
                id="stance-note"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="What changed your mind?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="triggered-comment">
                Triggered by a specific comment? (optional)
              </Label>
              <input
                id="triggered-comment"
                type="text"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Comment ID"
                value={triggeredByCommentId}
                onChange={(e) => setTriggeredByCommentId(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelChange}>
              Cancel
            </Button>
            <Button onClick={handleConfirmChange}>Confirm Change</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
