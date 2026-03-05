"use client";

import type { EngagementFingerprint } from "@/types/engagement";

interface FingerprintCardProps {
  fingerprint: EngagementFingerprint;
}

const DEPTH_COLORS: Record<string, string> = {
  shallow: "bg-amber-100 text-amber-800",
  moderate: "bg-blue-100 text-blue-800",
  deep: "bg-emerald-100 text-emerald-800",
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

const UPVOTE_LABELS: Record<string, string> = {
  well_reasoned: "Well Reasoned",
  well_sourced: "Well Sourced",
  changed_my_mind: "Changed My Mind",
  strong_counterpoint: "Strong Counterpoint",
  well_written: "Well Written",
};

function Bar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-28 shrink-0 text-right text-gray-600">{label}</span>
      <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-xs text-gray-500">{pct}%</span>
    </div>
  );
}

export function FingerprintCard({ fingerprint }: FingerprintCardProps) {
  const topUpvoteReason = (
    Object.entries(fingerprint.upvoteReasonProfile) as [string, number][]
  ).reduce(
    (best, [key, val]) => (val > best[1] ? [key, val] : best),
    ["none", 0] as [string, number]
  );

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Engagement Fingerprint
        </h3>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${DEPTH_COLORS[fingerprint.engagementDepth]}`}
        >
          {fingerprint.engagementDepth}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat
          label="Debates"
          value={fingerprint.debatesEngaged.toString()}
        />
        <Stat
          label="Stance Consistency"
          value={`${Math.round(fingerprint.stanceConsistency * 100)}%`}
        />
        <Stat
          label="Mind Change Rate"
          value={fingerprint.mindChangeRate.toFixed(2)}
        />
        <Stat
          label="Persuasion Score"
          value={fingerprint.persuasionScore.toString()}
        />
      </div>

      {/* Argument style breakdown */}
      <div className="space-y-1.5">
        <h4 className="text-sm font-medium text-gray-700">Argument Style</h4>
        {Object.entries(fingerprint.argumentStyleWeights).map(
          ([key, value]) => (
            <Bar
              key={key}
              label={TAXONOMY_LABELS[key] ?? key}
              value={value}
            />
          )
        )}
      </div>

      {/* Top upvote reason */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Top Upvote Reason</span>
        <span className="font-medium text-gray-900">
          {topUpvoteReason[1] > 0
            ? UPVOTE_LABELS[topUpvoteReason[0]] ?? topUpvoteReason[0]
            : "N/A"}
        </span>
      </div>

      {/* Computed at */}
      <p className="text-xs text-gray-400">
        Computed {new Date(fingerprint.computedAt).toLocaleDateString()}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
