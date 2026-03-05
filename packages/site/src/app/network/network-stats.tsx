"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface Stats {
  totalVerifiedSites: number;
  totalLinkedUsers: number;
  totalReputationSnapshots: number;
}

export function NetworkStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/federation/proxy/network-stats");
        if (!res.ok) throw new Error("Failed to load stats");
        const data = await res.json();
        setStats(data);
      } catch {
        // Stats are non-critical; silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-xl border bg-muted"
          />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const items = [
    { label: "Sites", value: stats.totalVerifiedSites },
    { label: "Linked Users", value: stats.totalLinkedUsers },
    { label: "Reputation Records", value: stats.totalReputationSnapshots },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{item.value.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">{item.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
