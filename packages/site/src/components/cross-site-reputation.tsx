"use client";

import { useEffect, useState } from "react";
import type { CrossSiteReputation } from "@/types/federation";

interface CrossSiteReputationProps {
  hubUserId: string;
}

export function CrossSiteReputationDisplay({
  hubUserId,
}: CrossSiteReputationProps) {
  const [data, setData] = useState<CrossSiteReputation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const response = await fetch(
          `/api/federation/cross-site-reputation?hubUserId=${encodeURIComponent(hubUserId)}`,
        );
        if (!response.ok) {
          setData(null);
          return;
        }
        const result = (await response.json()) as CrossSiteReputation;
        if (!cancelled) {
          setData(result);
        }
      } catch {
        if (!cancelled) {
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [hubUserId]);

  // Graceful: if loading, no data, or no breakdown, show nothing
  if (loading || !data || data.siteBreakdown.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Cross-Site Reputation
      </h3>

      <div className="mb-4 flex items-center gap-6">
        <div className="text-center">
          <div className="text-2xl font-bold">{data.globalReputationScore}</div>
          <div className="text-xs text-muted-foreground">Global Score</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{data.totalMindsChanged}</div>
          <div className="text-xs text-muted-foreground">Minds Changed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{data.siteBreakdown.length}</div>
          <div className="text-xs text-muted-foreground">Sites Active</div>
        </div>
      </div>

      <div className="space-y-2">
        {data.siteBreakdown.map((site) => (
          <div
            key={site.siteName}
            className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{site.siteName}</div>
              <div className="text-xs text-muted-foreground">
                {site.commentCount} comments · {site.debateCount} debates
              </div>
            </div>
            <div className="flex items-center gap-3 text-right">
              <div>
                <div className="font-semibold">{site.reputationScore}</div>
                <div className="text-[10px] text-muted-foreground">rep</div>
              </div>
              <div>
                <div className="font-semibold">{site.persuasionRating}</div>
                <div className="text-[10px] text-muted-foreground">persuasion</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
