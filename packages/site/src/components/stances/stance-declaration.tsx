"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
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
import { useSignInModal } from "@/components/auth/sign-in-modal";
import type { StanceSide } from "@/types/stances";

interface StanceDeclarationProps {
  debateSlug: string;
  debateId: string;
  sideALabel: string;
  sideBLabel: string;
  currentStance?: StanceSide | null;
  isGuest?: boolean;
  onGuestStance?: (stance: StanceSide) => void;
}

const stanceOptions: { value: StanceSide; colorClass: string; selectedBg: string; cardBorder: string; icon: string }[] = [
  {
    value: "side_a",
    colorClass:
      "border-blue-300 bg-blue-50 text-blue-900 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-100 dark:hover:bg-blue-900",
    selectedBg:
      "ring-2 ring-blue-500 bg-blue-200 border-blue-500 shadow-md dark:bg-blue-800 dark:ring-blue-400 dark:border-blue-400",
    cardBorder: "border-l-blue-500",
    icon: "text-blue-600 dark:text-blue-400",
  },
  {
    value: "side_b",
    colorClass:
      "border-red-300 bg-red-50 text-red-900 hover:bg-red-100 dark:border-red-700 dark:bg-red-950 dark:text-red-100 dark:hover:bg-red-900",
    selectedBg:
      "ring-2 ring-red-500 bg-red-200 border-red-500 shadow-md dark:bg-red-800 dark:ring-red-400 dark:border-red-400",
    cardBorder: "border-l-red-500",
    icon: "text-red-600 dark:text-red-400",
  },
  {
    value: "neutral",
    colorClass:
      "border-gray-300 bg-gray-50 text-gray-900 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
    selectedBg:
      "ring-2 ring-gray-500 bg-gray-200 border-gray-500 shadow-md dark:bg-gray-600 dark:ring-gray-400 dark:border-gray-400",
    cardBorder: "border-l-gray-500",
    icon: "text-gray-600 dark:text-gray-400",
  },
];

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn("size-5", className)}
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

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
  debateId,
  sideALabel,
  sideBLabel,
  currentStance: initialStance,
  isGuest,
  onGuestStance,
}: StanceDeclarationProps) {
  const { status } = useSession();
  const { openSignIn } = useSignInModal();
  const isGuestUser = isGuest ?? status !== "authenticated";

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

      if (isGuestUser) {
        setCurrentStance(stance);
        onGuestStance?.(stance);
        return;
      }

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
    [currentStance, isGuestUser, onGuestStance]
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

  const selectedOption = currentStance
    ? stanceOptions.find((o) => o.value === currentStance)
    : null;

  return (
    <>
      <Card
        className={cn(
          "transition-all duration-200",
          selectedOption && `border-l-4 ${selectedOption.cardBorder}`
        )}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Stance</CardTitle>
            {currentStance && isGuestUser && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                unsaved
              </span>
            )}
          </div>
          <CardDescription>
            {currentStance ? (
              <>
                You selected{" "}
                <strong className="text-foreground">
                  {getLabel(currentStance, sideALabel, sideBLabel)}
                </strong>
                .{" "}
                {isGuestUser ? (
                  <button
                    onClick={openSignIn}
                    className="underline font-medium hover:text-foreground"
                  >
                    Sign in to save
                  </button>
                ) : (
                  "You can change your stance at any time."
                )}
              </>
            ) : (
              "Declare where you stand on this debate."
            )}
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
                    "min-w-0 flex-1 border-2 py-3 font-medium transition-all whitespace-normal h-auto text-center relative",
                    option.colorClass,
                    isSelected && option.selectedBg
                  )}
                  onClick={() => handleSelect(option.value)}
                >
                  {isSelected && (
                    <CheckIcon className={cn("mr-1.5 shrink-0", option.icon)} />
                  )}
                  {getLabel(option.value, sideALabel, sideBLabel)}
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
