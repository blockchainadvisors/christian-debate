"use client";

import { cn } from "@/lib/utils";
import type { StanceSummary as StanceSummaryType } from "@/types/stances";

interface StanceSummaryProps {
  summary: StanceSummaryType;
  sideALabel: string;
  sideBLabel: string;
  className?: string;
}

export function StanceSummary({
  summary,
  sideALabel,
  sideBLabel,
  className,
}: StanceSummaryProps) {
  const total = summary.sideA + summary.sideB + summary.neutral;

  const pctA = total > 0 ? (summary.sideA / total) * 100 : 0;
  const pctB = total > 0 ? (summary.sideB / total) * 100 : 0;
  const pctN = total > 0 ? (summary.neutral / total) * 100 : 0;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Distribution bar */}
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        {pctA > 0 && (
          <div
            className="bg-blue-500 transition-all duration-300"
            style={{ width: `${pctA}%` }}
            title={`${sideALabel}: ${summary.sideA} (${Math.round(pctA)}%)`}
          />
        )}
        {pctB > 0 && (
          <div
            className="bg-red-500 transition-all duration-300"
            style={{ width: `${pctB}%` }}
            title={`${sideBLabel}: ${summary.sideB} (${Math.round(pctB)}%)`}
          />
        )}
        {pctN > 0 && (
          <div
            className="bg-gray-400 transition-all duration-300 dark:bg-gray-500"
            style={{ width: `${pctN}%` }}
            title={`Neutral: ${summary.neutral} (${Math.round(pctN)}%)`}
          />
        )}
      </div>

      {/* Counts */}
      <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
          {sideALabel}: {summary.sideA}
        </span>
        <span className="mx-1">|</span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
          {sideBLabel}: {summary.sideB}
        </span>
        <span className="mx-1">|</span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-gray-400 dark:bg-gray-500" />
          Neutral: {summary.neutral}
        </span>
      </div>
    </div>
  );
}
