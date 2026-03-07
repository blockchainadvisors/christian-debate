"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type {
  PreviewResponse,
  ConflictResolutions,
  VoteConflict,
  StanceConflict,
  CommentConflict,
} from "@/types/guest";

type VoteChoice = "keep_existing" | "use_guest" | "skip";
type StanceChoice = "keep_existing" | "use_guest" | "skip";
type CommentChoice = "submit" | "skip";

interface GuestConflictDialogProps {
  open: boolean;
  preview: PreviewResponse;
  onSubmit: (resolutions: ConflictResolutions) => void;
  onDiscard: () => void;
  submitting: boolean;
}

function formatStance(stance: string, sideALabel: string, sideBLabel: string): string {
  if (stance === "side_a") return sideALabel;
  if (stance === "side_b") return sideBLabel;
  return "Neutral";
}

function formatReason(reason: string): string {
  return reason.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function GuestConflictDialog({
  open,
  preview,
  onSubmit,
  onDiscard,
  submitting,
}: GuestConflictDialogProps) {
  const { conflicts, clean } = preview;

  const [voteChoices, setVoteChoices] = useState<Record<string, VoteChoice>>(() => {
    const defaults: Record<string, VoteChoice> = {};
    for (const vc of conflicts.votes) {
      defaults[vc.localId] = "keep_existing";
    }
    return defaults;
  });

  const [stanceChoices, setStanceChoices] = useState<Record<string, StanceChoice>>(() => {
    const defaults: Record<string, StanceChoice> = {};
    for (const sc of conflicts.stances) {
      defaults[sc.debateSlug] = "keep_existing";
    }
    return defaults;
  });

  const [commentChoices, setCommentChoices] = useState<Record<string, CommentChoice>>(() => {
    const defaults: Record<string, CommentChoice> = {};
    for (const cc of conflicts.comments) {
      defaults[cc.localId] = "skip";
    }
    return defaults;
  });

  const handleSubmit = () => {
    onSubmit({
      votes: voteChoices,
      stances: stanceChoices,
      comments: commentChoices,
    });
  };

  const cleanTotal = clean.comments + clean.votes + clean.stances;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        className="max-w-lg max-h-[80vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Review Your Guest Contributions</DialogTitle>
          <DialogDescription>
            Some of your guest activity conflicts with your account data. Please review below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {cleanTotal > 0 && (
            <div className="rounded-md bg-muted text-muted-foreground p-3 text-sm">
              <strong className="text-foreground">{cleanTotal}</strong> item{cleanTotal !== 1 ? "s" : ""} will be saved
              automatically
              {clean.comments > 0 && ` (${clean.comments} comment${clean.comments !== 1 ? "s" : ""})`}
              {clean.votes > 0 && ` (${clean.votes} vote${clean.votes !== 1 ? "s" : ""})`}
              {clean.stances > 0 && ` (${clean.stances} stance${clean.stances !== 1 ? "s" : ""})`}
            </div>
          )}

          {/* Vote conflicts */}
          {conflicts.votes.length > 0 && (
            <ConflictSection title={`Vote Conflict${conflicts.votes.length !== 1 ? "s" : ""}`}>
              {conflicts.votes.map((vc) => (
                <VoteConflictItem
                  key={vc.localId}
                  conflict={vc}
                  choice={voteChoices[vc.localId]}
                  onChange={(choice) =>
                    setVoteChoices((prev) => ({ ...prev, [vc.localId]: choice }))
                  }
                />
              ))}
            </ConflictSection>
          )}

          {/* Stance conflicts */}
          {conflicts.stances.length > 0 && (
            <ConflictSection title={`Stance Conflict${conflicts.stances.length !== 1 ? "s" : ""}`}>
              {conflicts.stances.map((sc) => (
                <StanceConflictItem
                  key={sc.debateSlug}
                  conflict={sc}
                  choice={stanceChoices[sc.debateSlug]}
                  onChange={(choice) =>
                    setStanceChoices((prev) => ({ ...prev, [sc.debateSlug]: choice }))
                  }
                />
              ))}
            </ConflictSection>
          )}

          {/* Comment duplicates */}
          {conflicts.comments.length > 0 && (
            <ConflictSection title={`Duplicate Comment${conflicts.comments.length !== 1 ? "s" : ""}`}>
              {conflicts.comments.map((cc) => (
                <CommentConflictItem
                  key={cc.localId}
                  conflict={cc}
                  choice={commentChoices[cc.localId]}
                  onChange={(choice) =>
                    setCommentChoices((prev) => ({ ...prev, [cc.localId]: choice }))
                  }
                />
              ))}
            </ConflictSection>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit"}
          </Button>
          <Button variant="ghost" onClick={onDiscard} disabled={submitting}>
            Discard All Guest Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConflictSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      {children}
    </div>
  );
}

function ChoiceButtons<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 flex-wrap mt-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-2 py-0.5 text-xs rounded border transition-colors ${
            value === opt.value
              ? "bg-primary text-primary-foreground border-transparent"
              : "border-border text-foreground hover:bg-muted"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function VoteConflictItem({
  conflict,
  choice,
  onChange,
}: {
  conflict: VoteConflict;
  choice: VoteChoice;
  onChange: (c: VoteChoice) => void;
}) {
  return (
    <div className="rounded border border-border p-2 text-sm text-foreground space-y-1">
      <p className="text-xs text-muted-foreground">
        {conflict.debateTitle}
      </p>
      <p className="text-xs italic truncate text-foreground">&ldquo;{conflict.commentPreview}&rdquo;</p>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>
          Account: {conflict.existingDirection === "up" ? "\u2191" : "\u2193"}{" "}
          {formatReason(conflict.existingReason)}
        </span>
        <span>
          Guest: {conflict.guestDirection === "up" ? "\u2191" : "\u2193"}{" "}
          {formatReason(conflict.guestReason)}
        </span>
      </div>
      <ChoiceButtons
        options={[
          { value: "keep_existing" as const, label: "Keep account" },
          { value: "use_guest" as const, label: "Use guest" },
          { value: "skip" as const, label: "Skip" },
        ]}
        value={choice}
        onChange={onChange}
      />
    </div>
  );
}

function StanceConflictItem({
  conflict,
  choice,
  onChange,
}: {
  conflict: StanceConflict;
  choice: StanceChoice;
  onChange: (c: StanceChoice) => void;
}) {
  return (
    <div className="rounded border border-border p-2 text-sm text-foreground space-y-1">
      <p className="font-medium text-xs">{conflict.debateTitle}</p>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>
          Account: {formatStance(conflict.existingStance, conflict.sideALabel, conflict.sideBLabel)}
        </span>
        <span>
          Guest: {formatStance(conflict.guestStance, conflict.sideALabel, conflict.sideBLabel)}
        </span>
      </div>
      <ChoiceButtons
        options={[
          { value: "keep_existing" as const, label: "Keep account" },
          { value: "use_guest" as const, label: "Use guest" },
          { value: "skip" as const, label: "Skip" },
        ]}
        value={choice}
        onChange={onChange}
      />
    </div>
  );
}

function CommentConflictItem({
  conflict,
  choice,
  onChange,
}: {
  conflict: CommentConflict;
  choice: CommentChoice;
  onChange: (c: CommentChoice) => void;
}) {
  return (
    <div className="rounded border border-border p-2 text-sm text-foreground space-y-1">
      <p className="text-xs text-muted-foreground">
        {conflict.debateTitle}
      </p>
      <p className="text-xs italic truncate text-foreground">&ldquo;{conflict.contentPreview}&rdquo;</p>
      <p className="text-xs text-amber-600 dark:text-amber-400">Already posted (duplicate)</p>
      <ChoiceButtons
        options={[
          { value: "skip" as const, label: "Skip (recommended)" },
          { value: "submit" as const, label: "Post again" },
        ]}
        value={choice}
        onChange={onChange}
      />
    </div>
  );
}
