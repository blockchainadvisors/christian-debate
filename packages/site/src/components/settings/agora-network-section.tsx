"use client";

import { useEffect, useState, useCallback } from "react";
import { signIn } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    signIn("agora", { callbackUrl: "/settings" });
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

  if (loading) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Agora Network</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Agora Network</CardTitle>
      </CardHeader>
      <CardContent>
        {status?.linked ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-foreground/10 p-4">
              <p className="text-sm font-medium text-green-600">
                Connected to Agora Network
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

            <div className={savingVisibility ? "opacity-50 pointer-events-none" : ""}>
              <VisibilityControls
                currentVisibility={status.visibility ?? "private"}
                onChange={handleVisibilityChange}
              />
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
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your account to the Agora Network to sync your profile
              across federated debate sites and build a cross-platform reputation.
            </p>
            <button
              onClick={handleLink}
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Link Profile
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
