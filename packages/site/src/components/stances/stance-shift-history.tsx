"use client";

import { cn } from "@/lib/utils";
import type { StanceShift, StanceSide } from "@/types/stances";

interface StanceShiftHistoryProps {
  shifts: StanceShift[];
  sideALabel?: string;
  sideBLabel?: string;
  className?: string;
}

function formatStanceLabel(
  stance: StanceSide,
  sideALabel: string,
  sideBLabel: string
): string {
  if (stance === "side_a") return sideALabel;
  if (stance === "side_b") return sideBLabel;
  return "Neutral";
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const stanceDotColor: Record<StanceSide, string> = {
  side_a: "bg-blue-500",
  side_b: "bg-red-500",
  neutral: "bg-gray-400",
};

export function StanceShiftHistory({
  shifts,
  sideALabel = "Side A",
  sideBLabel = "Side B",
  className,
}: StanceShiftHistoryProps) {
  if (shifts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No stance changes yet.</p>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {shifts.map((shift, index) => (
        <div key={shift.id} className="relative flex gap-3 pb-6 last:pb-0">
          {/* Timeline line */}
          {index < shifts.length - 1 && (
            <div className="absolute left-[7px] top-4 h-full w-px bg-border" />
          )}

          {/* Dot */}
          <div
            className={cn(
              "mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-background",
              stanceDotColor[shift.toStance]
            )}
          />

          {/* Content */}
          <div className="flex flex-col gap-1">
            <p className="text-sm">
              Changed from{" "}
              <strong>
                {formatStanceLabel(shift.fromStance, sideALabel, sideBLabel)}
              </strong>{" "}
              to{" "}
              <strong>
                {formatStanceLabel(shift.toStance, sideALabel, sideBLabel)}
              </strong>
            </p>

            <p className="text-xs text-muted-foreground">
              {formatDate(shift.shiftedAt)}
            </p>

            {shift.note && (
              <p className="text-sm text-muted-foreground italic">
                &ldquo;{shift.note}&rdquo;
              </p>
            )}

            {shift.triggeredByCommentId && (
              <p className="text-xs text-muted-foreground">
                Triggered by a comment
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
