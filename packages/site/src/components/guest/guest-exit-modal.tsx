"use client";

import Link from "next/link";
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

interface GuestExitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeave: () => void;
}

export function GuestExitModal({ open, onOpenChange, onLeave }: GuestExitModalProps) {
  const counts = getGuestCounts();

  const parts: string[] = [];
  if (counts.comments > 0) {
    parts.push(`${counts.comments} comment${counts.comments !== 1 ? "s" : ""}`);
  }
  if (counts.votes > 0) {
    parts.push(`${counts.votes} vote${counts.votes !== 1 ? "s" : ""}`);
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
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/register">Register</Link>
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
