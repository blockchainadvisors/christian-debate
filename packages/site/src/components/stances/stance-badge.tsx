import { cn } from "@/lib/utils";
import type { StanceSide, AlgorithmicLean } from "@/types/stances";

interface StanceBadgeProps {
  declaredStance: StanceSide;
  sideALabel: string;
  sideBLabel: string;
  algorithmicLean?: AlgorithmicLean | null;
  leanConfidence?: number | null;
  className?: string;
}

const stanceColors: Record<StanceSide, string> = {
  side_a: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  side_b: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  neutral: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};

function getStanceLabel(
  stance: StanceSide,
  sideALabel: string,
  sideBLabel: string
): string {
  if (stance === "side_a") return sideALabel;
  if (stance === "side_b") return sideBLabel;
  return "Neutral";
}

function getLeanLabel(
  lean: AlgorithmicLean,
  sideALabel: string,
  sideBLabel: string
): string | null {
  if (lean === "side_a") return sideALabel;
  if (lean === "side_b") return sideBLabel;
  if (lean === "neutral") return "Neutral";
  return null;
}

export function StanceBadge({
  declaredStance,
  sideALabel,
  sideBLabel,
  algorithmicLean,
  leanConfidence,
  className,
}: StanceBadgeProps) {
  const label = getStanceLabel(declaredStance, sideALabel, sideBLabel);
  const colorClasses = stanceColors[declaredStance];

  const showLean =
    algorithmicLean &&
    algorithmicLean !== declaredStance &&
    algorithmicLean !== "mixed" &&
    leanConfidence != null &&
    leanConfidence > 0.5;

  const leanText = showLean
    ? getLeanLabel(algorithmicLean, sideALabel, sideBLabel)
    : null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        colorClasses,
        className
      )}
    >
      {label}
      {leanText && (
        <span className="text-[10px] opacity-70">Leans {leanText}</span>
      )}
    </span>
  );
}
