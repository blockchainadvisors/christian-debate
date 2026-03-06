"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { hasGuestData } from "@/lib/guest-cache";
import { GuestExitModal } from "./guest-exit-modal";

export function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const pendingHref = useRef<string | null>(null);

  // beforeunload: native browser warning on tab close
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (status !== "authenticated" && hasGuestData()) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [status]);

  // Intercept clicks on internal links
  useEffect(() => {
    if (status === "authenticated") return;

    function handler(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("mailto:")) return;
      // Skip login/register links — those are intentional
      if (href === "/login" || href === "/register") return;

      if (hasGuestData()) {
        e.preventDefault();
        e.stopPropagation();
        pendingHref.current = href;
        setModalOpen(true);
      }
    }

    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [status]);

  const handleLeave = useCallback(() => {
    if (pendingHref.current) {
      router.push(pendingHref.current);
      pendingHref.current = null;
    }
  }, [router]);

  return (
    <>
      {children}
      <GuestExitModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onLeave={handleLeave}
      />
    </>
  );
}
