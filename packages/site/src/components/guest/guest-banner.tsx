"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useGuestCache } from "@/hooks/use-guest-cache";
import { useSignInModal } from "@/components/auth/sign-in-modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function GuestBanner() {
  const { status } = useSession();
  const { counts, hasData } = useGuestCache();
  const { openSignIn } = useSignInModal();
  const [dismissed, setDismissed] = useState(false);

  if (status === "authenticated" || !hasData || dismissed) return null;

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
    <div
      className={cn(
        "fixed bottom-0 inset-x-0 z-50",
        "bg-amber-50 border-t border-amber-200",
        "px-4 py-3 text-sm text-amber-900",
        "flex items-center justify-between gap-3 flex-wrap"
      )}
    >
      <p className="flex-1 min-w-0">
        You have <strong>{parts.join(" and ")}</strong> pending.{" "}
        <button onClick={openSignIn} className="underline font-medium hover:text-amber-700">
          Sign in to save
        </button>
      </p>
      <Button
        variant="ghost"
        size="sm"
        className="shrink-0 text-amber-700 hover:text-amber-900 hover:bg-amber-100"
        onClick={() => setDismissed(true)}
      >
        Dismiss
      </Button>
    </div>
  );
}
