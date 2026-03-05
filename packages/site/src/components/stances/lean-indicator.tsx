"use client";

import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LeanIndicatorProps {
  declaredStance: "side_a" | "side_b" | "neutral";
  algorithmicLean: "side_a" | "side_b" | "neutral" | "mixed" | null;
  leanConfidence: number | null;
  sideALabel: string;
  sideBLabel: string;
}

export function LeanIndicator({
  declaredStance,
  algorithmicLean,
  leanConfidence,
  sideALabel,
  sideBLabel,
}: LeanIndicatorProps) {
  // Only show when declared stance is neutral and confidence > 0.5
  if (declaredStance !== "neutral") return null;
  if (!algorithmicLean || algorithmicLean === "neutral" || algorithmicLean === "mixed") return null;
  if (leanConfidence === null || leanConfidence <= 0.5) return null;

  const leanLabel = algorithmicLean === "side_a" ? sideALabel : sideBLabel;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center text-muted-foreground cursor-help ml-1">
            <Info className="h-3.5 w-3.5" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Activity suggests {leanLabel}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
