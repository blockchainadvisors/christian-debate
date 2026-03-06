"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getGuestCounts } from "@/lib/guest-cache";
import { useSignInModal } from "@/components/auth/sign-in-modal";

interface GuestExitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeave: () => void;
}

export function GuestExitModal({ open, onOpenChange, onLeave }: GuestExitModalProps) {
  const counts = getGuestCounts();
  const { openSignIn } = useSignInModal();

  const parts: string[] = [];
  if (counts.comments > 0) {
    parts.push(`${counts.comments} comment${counts.comments !== 1 ? "s" : ""}`);
  }
  if (counts.votes > 0) {
    parts.push(`${counts.votes} vote${counts.votes !== 1 ? "s" : ""}`);
  }
  if (counts.stances > 0) {
    parts.push(`${counts.stances} stance${counts.stances !== 1 ? "s" : ""}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>You have unsaved contributions</DialogTitle>
          <DialogDescription>
            You have {parts.join(" and ")} pending. If you leave without logging in, they will be
            lost when you close this browser tab.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => {
              onOpenChange(false);
              openSignIn();
            }}
          >
            Sign In
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              onOpenChange(false);
              onLeave();
            }}
          >
            Leave anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
