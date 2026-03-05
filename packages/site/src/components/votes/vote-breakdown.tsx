"use client";

import type { VoteBreakdown as VoteBreakdownType } from "@/types/votes";
import { cn } from "@/lib/utils";

const REASON_LABELS: Record<string, string> = {
  well_reasoned: "Well Reasoned",
  well_sourced: "Well Sourced",
  changed_my_mind: "Changed My Mind",
  strong_counterpoint: "Strong Counterpoint",
  well_written: "Well Written",
  off_topic: "Off Topic",
  uncivil: "Uncivil",
  misleading_unsourced: "Misleading/Unsourced",
  misrepresented_stance: "Misrepresented Stance",
  low_effort: "Low Effort",
};

const UP_COLORS: Record<string, string> = {
  well_reasoned: "bg-emerald-500",
  well_sourced: "bg-blue-500",
  changed_my_mind: "bg-amber-500",
  strong_counterpoint: "bg-violet-500",
  well_written: "bg-cyan-500",
};

const DOWN_COLORS: Record<string, string> = {
  off_topic: "bg-red-400",
  uncivil: "bg-red-600",
  misleading_unsourced: "bg-orange-500",
  misrepresented_stance: "bg-rose-500",
  low_effort: "bg-gray-500",
};

interface VoteBreakdownProps {
  breakdown: VoteBreakdownType;
}

export function VoteBreakdown({ breakdown }: VoteBreakdownProps) {
  const totalUpvotes = Object.values(breakdown.up).reduce(
    (sum, count) => sum + count,
    0
  );
  const totalDownvotes = Object.values(breakdown.down).reduce(
    (sum, count) => sum + count,
    0
  );
  const totalVotes = totalUpvotes + totalDownvotes;

  if (totalVotes === 0) {
    return null;
  }

  const upEntries = Object.entries(breakdown.up).filter(([, count]) => count > 0);
  const downEntries = Object.entries(breakdown.down).filter(
    ([, count]) => count > 0
  );

  return (
    <div className="space-y-2">
      {/* Stacked bar chart */}
      {totalUpvotes > 0 && (
        <div className="flex h-2 w-full overflow-hidden rounded-full">
          {upEntries.map(([reason, count]) => (
            <div
              key={reason}
              className={cn("h-full", UP_COLORS[reason])}
              style={{ width: `${(count / totalUpvotes) * 100}%` }}
              title={`${REASON_LABELS[reason]}: ${count}`}
            />
          ))}
        </div>
      )}

      {/* Reason counts */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {upEntries.map(([reason, count]) => (
          <span key={reason} className="flex items-center gap-1">
            <span
              className={cn("inline-block size-2 rounded-full", UP_COLORS[reason])}
            />
            <span>
              {REASON_LABELS[reason]}: {count}
            </span>
          </span>
        ))}
        {downEntries.map(([reason, count]) => (
          <span key={reason} className="flex items-center gap-1">
            <span
              className={cn(
                "inline-block size-2 rounded-full",
                DOWN_COLORS[reason]
              )}
            />
            <span>
              {REASON_LABELS[reason]}: {count}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
