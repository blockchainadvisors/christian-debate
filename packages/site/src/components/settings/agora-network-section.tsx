"use client";

import { useEffect, useState, useCallback } from "react";
import { signIn } from "next-auth/react";
import { VisibilityControls } from "./visibility-controls";

type Visibility = "public" | "mutual_only" | "private";

interface FederationStatus {
  linked: boolean;
  hubUserId?: string;
  linkedAt?: string;
  syncedAt?: string;
  visibility?: Visibility;
}

export function AgoraNetworkSection() {
  const [status, setStatus] = useState<FederationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlinking, setUnlinking] = useState(false);
  const [savingVisibility, setSavingVisibility] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/federation/status");
      if (!res.ok) throw new Error("Failed to fetch status");
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleLink = () => {
    signIn("agora", { callbackUrl: "/settings/security" });
  };

  const handleUnlink = async () => {
    setUnlinking(true);
    try {
      const res = await fetch("/api/federation/unlink", { method: "POST" });
      if (!res.ok) throw new Error("Failed to unlink");
      setStatus({ linked: false });
    } catch {
      // User can retry
    } finally {
      setUnlinking(false);
    }
  };

  const handleVisibilityChange = async (visibility: Visibility) => {
    if (!status?.hubUserId) return;
    setSavingVisibility(true);
    try {
      const res = await fetch("/api/federation/visibility", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility }),
      });
      if (!res.ok) throw new Error("Failed to update visibility");
      setStatus((prev) => (prev ? { ...prev, visibility } : prev));
    } catch {
      // User can retry
    } finally {
      setSavingVisibility(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Section header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/8">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 dark:text-indigo-400">
              <circle cx="8" cy="8" r="6.5" />
              <path d="M1.5 8h13M8 1.5c-2 2-3 4-3 6.5s1 4.5 3 6.5c2-2 3-4 3-6.5s-1-4.5-3-6.5" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-foreground">Agora Network</h3>
        </div>
        {!loading && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              status?.linked
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                status?.linked ? "bg-emerald-500" : "bg-muted-foreground/40"
              }`}
            />
            {status?.linked ? "Connected" : "Not linked"}
          </span>
        )}
      </div>

      <div className="px-6 py-5">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : status?.linked ? (
          <div className="space-y-5">
            {/* Connection details */}
            <div className="divide-y divide-border rounded-lg border border-border">
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-muted-foreground">Hub User ID</span>
                <span className="font-mono text-xs text-foreground">{status.hubUserId}</span>
              </div>
              {status.linkedAt && (
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-muted-foreground">Linked</span>
                  <span className="text-xs text-foreground">
                    {new Date(status.linkedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {status.syncedAt && (
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-muted-foreground">Last synced</span>
                  <span className="text-xs text-foreground">
                    {new Date(status.syncedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Visibility control */}
            <div className={savingVisibility ? "opacity-50 pointer-events-none" : ""}>
              <VisibilityControls
                currentVisibility={status.visibility ?? "private"}
                onChange={handleVisibilityChange}
              />
            </div>

            <button
              onClick={handleUnlink}
              disabled={unlinking}
              className="w-full rounded-lg border border-destructive/30 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-50"
            >
              {unlinking ? "Unlinking\u2026" : "Unlink from Agora Network"}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Connect your account to the Agora Network to sync your profile across federated debate sites and build a cross-platform reputation.
            </p>
            <button
              onClick={handleLink}
              className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Link to Agora Network
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
