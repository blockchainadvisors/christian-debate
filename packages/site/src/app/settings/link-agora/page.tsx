"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";

interface FederationStatus {
  linked: boolean;
  hubUserId?: string;
  linkedAt?: string;
  syncedAt?: string;
}

export default function LinkAgoraPage() {
  const [status, setStatus] = useState<FederationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlinking, setUnlinking] = useState(false);

  const fetchStatus = async () => {
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
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleLink = () => {
    signIn("agora", { callbackUrl: "/settings/link-agora" });
  };

  const handleUnlink = async () => {
    setUnlinking(true);
    try {
      const res = await fetch("/api/federation/unlink", { method: "POST" });
      if (!res.ok) throw new Error("Failed to unlink");
      setStatus({ linked: false });
    } catch {
      // silently fail, user can retry
    } finally {
      setUnlinking(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-md flex-col items-center justify-center px-4">
        <p className="text-sm text-foreground/60">Loading...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-md flex-col items-center justify-center px-4">
      <h1 className="mb-2 text-2xl font-bold">Agora Network</h1>
      <p className="mb-8 text-center text-sm text-foreground/60">
        Link your account to the Agora Network to sync your profile across
        federated sites.
      </p>

      {status?.linked ? (
        <div className="w-full space-y-4">
          <div className="rounded-lg border border-foreground/10 p-4">
            <p className="text-sm font-medium text-green-600">
              Linked to Agora Network
            </p>
            <p className="mt-1 text-xs text-foreground/50">
              Hub User ID: {status.hubUserId}
            </p>
            {status.linkedAt && (
              <p className="mt-0.5 text-xs text-foreground/50">
                Linked: {new Date(status.linkedAt).toLocaleDateString()}
              </p>
            )}
            {status.syncedAt && (
              <p className="mt-0.5 text-xs text-foreground/50">
                Last synced: {new Date(status.syncedAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <button
            onClick={handleUnlink}
            disabled={unlinking}
            className="w-full rounded-lg border border-red-300 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {unlinking ? "Unlinking..." : "Unlink from Agora Network"}
          </button>
        </div>
      ) : (
        <button
          onClick={handleLink}
          className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Link to Agora Network
        </button>
      )}
    </main>
  );
}
