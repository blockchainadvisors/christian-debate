"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface LeaderboardEntry {
  hubUserId: string;
  displayName: string;
  avatarUrl: string | null;
  totalPersuasionRating: number;
  sitesActive: number;
  globalReputationScore: number;
}

export function NetworkLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch("/api/federation/proxy/leaderboard");
        if (!res.ok) throw new Error("Failed to load leaderboard");
        const data = await res.json();
        setEntries(data.leaderboard ?? []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load leaderboard",
        );
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-lg border bg-muted"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No leaderboard data available yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Persuaders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {entries.map((entry, index) => (
            <div
              key={entry.hubUserId}
              className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/50"
            >
              {/* Rank */}
              <span className="w-8 shrink-0 text-center text-sm font-bold text-muted-foreground">
                #{index + 1}
              </span>

              {/* Avatar */}
              {entry.avatarUrl ? (
                <img
                  src={entry.avatarUrl}
                  alt={entry.displayName}
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {entry.displayName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}

              {/* Name */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {entry.displayName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Active on {entry.sitesActive}{" "}
                  {entry.sitesActive === 1 ? "site" : "sites"}
                </p>
              </div>

              {/* Stats */}
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold">
                  {entry.totalPersuasionRating}
                </p>
                <p className="text-xs text-muted-foreground">minds changed</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
