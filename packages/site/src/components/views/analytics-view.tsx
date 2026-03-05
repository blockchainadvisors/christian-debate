"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SimpleBarChart } from "@/components/charts/simple-bar-chart";
import { StackedTimeline } from "@/components/charts/stacked-timeline";

interface AnalyticsData {
  stanceTimeline: {
    date: string;
    sideA: number;
    sideB: number;
    neutral: number;
  }[];
  voteReasonBreakdown: { reason: string; count: number }[];
  persuasionLeaderboard: {
    userId: string;
    displayName: string;
    username: string;
    count: number;
  }[];
  taxonomyBreakdown: {
    taxonomy: string;
    avgScore: number;
    count: number;
  }[];
  engagementDepth: { depth: number; count: number }[];
  summary: {
    totalComments: number;
    totalVotes: number;
    totalParticipants: number;
    avgCommentScore: number;
    stanceShiftCount: number;
  };
}

interface AnalyticsViewProps {
  debate: {
    slug: string;
    sideALabel: string;
    sideBLabel: string;
  };
}

const UPVOTE_REASONS = new Set([
  "well_reasoned",
  "well_sourced",
  "changed_my_mind",
  "strong_counterpoint",
  "well_written",
]);

const REASON_LABELS: Record<string, string> = {
  well_reasoned: "Well Reasoned",
  well_sourced: "Well Sourced",
  changed_my_mind: "Changed My Mind",
  strong_counterpoint: "Strong Counterpoint",
  well_written: "Well Written",
  off_topic: "Off Topic",
  uncivil: "Uncivil",
  misleading_unsourced: "Misleading / Unsourced",
  misrepresented_stance: "Misrepresented Stance",
  low_effort: "Low Effort",
};

const TAXONOMY_LABELS: Record<string, string> = {
  empirical: "Empirical",
  moral_ethical: "Moral / Ethical",
  economic: "Economic",
  procedural: "Procedural",
  anecdotal: "Anecdotal",
  legal: "Legal",
  historical: "Historical",
};

const TAXONOMY_COLORS: Record<string, string> = {
  empirical: "#3b82f6",
  moral_ethical: "#8b5cf6",
  economic: "#f59e0b",
  procedural: "#6366f1",
  anecdotal: "#ec4899",
  legal: "#14b8a6",
  historical: "#f97316",
};

export function AnalyticsView({ debate }: AnalyticsViewProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch(
          `/api/debates/${debate.slug}/analytics`
        );
        if (!res.ok) throw new Error("Failed to load analytics");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [debate.slug]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border p-8 text-center text-muted-foreground">
        {error || "No analytics data available."}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Summary Stats */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            <StatCard label="Comments" value={data.summary.totalComments} />
            <StatCard label="Votes" value={data.summary.totalVotes} />
            <StatCard
              label="Participants"
              value={data.summary.totalParticipants}
            />
            <StatCard
              label="Avg Score"
              value={data.summary.avgCommentScore}
            />
            <StatCard
              label="Stance Shifts"
              value={data.summary.stanceShiftCount}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stance Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Stance Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <StackedTimeline
            data={data.stanceTimeline.map((entry) => ({
              date: entry.date,
              segments: [
                {
                  label: debate.sideALabel,
                  value: entry.sideA,
                  color: "#3b82f6",
                },
                {
                  label: debate.sideBLabel,
                  value: entry.sideB,
                  color: "#ef4444",
                },
                { label: "Neutral", value: entry.neutral, color: "#9ca3af" },
              ],
            }))}
          />
        </CardContent>
      </Card>

      {/* Vote Reasons */}
      <Card>
        <CardHeader>
          <CardTitle>Vote Reasons</CardTitle>
        </CardHeader>
        <CardContent>
          <VoteReasonChart reasons={data.voteReasonBreakdown} />
        </CardContent>
      </Card>

      {/* Persuasion Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Persuasion Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          {data.persuasionLeaderboard.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No minds changed yet.
            </p>
          ) : (
            <ol className="space-y-2">
              {data.persuasionLeaderboard.map((user, i) => (
                <li key={user.userId} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {i + 1}
                  </span>
                  <Link
                    href={`/u/${user.username}`}
                    className="truncate font-medium hover:underline"
                  >
                    {user.displayName}
                  </Link>
                  <span className="ml-auto shrink-0 text-sm text-muted-foreground tabular-nums">
                    {user.count} mind{user.count !== 1 ? "s" : ""} changed
                  </span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Taxonomy Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Argument Types</CardTitle>
        </CardHeader>
        <CardContent>
          {data.taxonomyBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tagged arguments yet.
            </p>
          ) : (
            <SimpleBarChart
              data={data.taxonomyBreakdown.map((t) => ({
                label: TAXONOMY_LABELS[t.taxonomy] || t.taxonomy,
                value: t.count,
                color: TAXONOMY_COLORS[t.taxonomy] || "#6b7280",
              }))}
              showLabels
            />
          )}
          {data.taxonomyBreakdown.length > 0 && (
            <div className="mt-3 space-y-1">
              {data.taxonomyBreakdown.map((t) => (
                <div
                  key={t.taxonomy}
                  className="flex items-center justify-between text-xs text-muted-foreground"
                >
                  <span>{TAXONOMY_LABELS[t.taxonomy] || t.taxonomy}</span>
                  <span className="tabular-nums">
                    avg score: {t.avgScore.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Engagement Depth */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Engagement Depth</CardTitle>
        </CardHeader>
        <CardContent>
          {data.engagementDepth.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No comments yet.
            </p>
          ) : (
            <SimpleBarChart
              data={data.engagementDepth.map((d) => ({
                label: d.depth >= 6 ? "6+" : `${d.depth}`,
                value: d.count,
                color: `hsl(${220 - d.depth * 20}, 70%, 55%)`,
              }))}
              maxHeight={120}
              showLabels
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function VoteReasonChart({
  reasons,
}: {
  reasons: { reason: string; count: number }[];
}) {
  if (reasons.length === 0) {
    return <p className="text-sm text-muted-foreground">No votes yet.</p>;
  }

  const maxCount = Math.max(...reasons.map((r) => r.count), 1);

  return (
    <div className="space-y-2">
      {reasons.map((r) => {
        const isUpvote = UPVOTE_REASONS.has(r.reason);
        const barColor = isUpvote ? "#22c55e" : "#ef4444";
        const barWidth = (r.count / maxCount) * 100;

        return (
          <div key={r.reason} className="space-y-0.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {REASON_LABELS[r.reason] || r.reason}
              </span>
              <span className="tabular-nums font-medium">{r.count}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${barWidth}%`,
                  backgroundColor: barColor,
                  minWidth: r.count > 0 ? 4 : 0,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
