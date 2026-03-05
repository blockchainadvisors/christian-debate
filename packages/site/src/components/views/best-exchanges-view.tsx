"use client";

import { useEffect, useState } from "react";
import type { ExchangePair } from "@/types/exchanges";
import { ExchangePairCard } from "@/components/views/exchange-pair";

interface BestExchangesViewProps {
  debate: {
    slug: string;
    sideALabel: string;
    sideBLabel: string;
  };
}

type SortOption = "score" | "recent";

export function BestExchangesView({ debate }: BestExchangesViewProps) {
  const [exchanges, setExchanges] = useState<ExchangePair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("score");

  useEffect(() => {
    async function fetchExchanges() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/debates/${debate.slug}/exchanges?sort=${sort}`
        );
        if (!res.ok) {
          throw new Error("Failed to fetch exchanges");
        }
        const data = await res.json();
        setExchanges(data.exchanges);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch exchanges"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchExchanges();
  }, [debate.slug, sort]);

  return (
    <div className="space-y-4">
      {/* Sort control */}
      <div className="flex items-center justify-end gap-2">
        <label
          htmlFor="exchange-sort"
          className="text-sm text-muted-foreground"
        >
          Sort by:
        </label>
        <select
          id="exchange-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="rounded-md border bg-background px-2 py-1 text-sm"
        >
          <option value="score">Score</option>
          <option value="recent">Recent</option>
        </select>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <p className="text-sm">Loading exchanges...</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="rounded-lg border border-dashed border-destructive/50 p-12 text-center text-destructive">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && exchanges.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <p className="text-lg font-medium">No high-quality exchanges yet.</p>
          <p className="mt-1 text-sm">Keep the debate going!</p>
        </div>
      )}

      {/* Exchange list */}
      {!loading &&
        !error &&
        exchanges.map((exchange) => (
          <ExchangePairCard
            key={exchange.id}
            exchange={exchange}
            sideALabel={debate.sideALabel}
            sideBLabel={debate.sideBLabel}
            debateSlug={debate.slug}
          />
        ))}
    </div>
  );
}
