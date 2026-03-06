"use client";

import type { VerdictTally } from "@/types/verdict";

interface VerdictTallyBarProps {
  tally: VerdictTally;
  sideALabel: string;
  sideBLabel: string;
}

export function VerdictTallyBar({
  tally,
  sideALabel,
  sideBLabel,
}: VerdictTallyBarProps) {
  const total = tally.sideA + tally.sideB + tally.draw;
  const pctA = total > 0 ? (tally.sideA / total) * 100 : 33.3;
  const pctDraw = total > 0 ? (tally.draw / total) * 100 : 33.3;
  const pctB = total > 0 ? (tally.sideB / total) * 100 : 33.4;

  return (
    <div className="w-full">
      {/* Bar */}
      <div className="flex h-10 w-full overflow-hidden rounded-lg">
        <div
          className="flex items-center justify-center bg-blue-600 text-white text-sm font-semibold transition-all duration-500 ease-in-out"
          style={{ width: `${pctA}%`, minWidth: total > 0 && tally.sideA > 0 ? "2rem" : 0 }}
        >
          {total > 0 && tally.sideA > 0 && `${Math.round(pctA)}%`}
        </div>
        <div
          className="flex items-center justify-center bg-gray-400 text-white text-sm font-semibold transition-all duration-500 ease-in-out"
          style={{ width: `${pctDraw}%`, minWidth: total > 0 && tally.draw > 0 ? "2rem" : 0 }}
        >
          {total > 0 && tally.draw > 0 && `${Math.round(pctDraw)}%`}
        </div>
        <div
          className="flex items-center justify-center bg-red-600 text-white text-sm font-semibold transition-all duration-500 ease-in-out"
          style={{ width: `${pctB}%`, minWidth: total > 0 && tally.sideB > 0 ? "2rem" : 0 }}
        >
          {total > 0 && tally.sideB > 0 && `${Math.round(pctB)}%`}
        </div>
      </div>

      {/* Labels and counts */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{tally.sideA}</p>
          <p className="text-muted-foreground">{sideALabel}</p>
        </div>
        <div className="text-center border-x border-border px-2">
          <p className="text-2xl font-bold text-gray-500">{tally.draw}</p>
          <p className="text-muted-foreground">Draw</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">{tally.sideB}</p>
          <p className="text-muted-foreground">{sideBLabel}</p>
        </div>
      </div>
    </div>
  );
}
