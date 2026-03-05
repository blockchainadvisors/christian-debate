"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CommentWithAuthor } from "@/types/comments";

const STANCE_COLORS: Record<string, string> = {
  side_a: "bg-blue-100 text-blue-800 border-blue-200",
  side_b: "bg-red-100 text-red-800 border-red-200",
  neutral: "bg-gray-100 text-gray-800 border-gray-200",
  meta: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

interface AncestorTrailProps {
  ancestors: CommentWithAuthor[];
  sideALabel: string;
  sideBLabel: string;
}

function getStanceLabel(
  side: string,
  sideALabel: string,
  sideBLabel: string
): string {
  switch (side) {
    case "side_a":
      return sideALabel;
    case "side_b":
      return sideBLabel;
    case "neutral":
      return "Neutral";
    case "meta":
      return "Meta";
    default:
      return side;
  }
}

function truncateContent(html: string, maxLength: number = 80): string {
  // Strip HTML tags to get plain text for preview
  const text = html.replace(/<[^>]*>/g, "").trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

function scrollToComment(commentId: string) {
  const el = document.getElementById(`comment-${commentId}`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    // Brief highlight effect
    el.classList.add("bg-yellow-50");
    setTimeout(() => el.classList.remove("bg-yellow-50"), 2000);
  }
}

export function AncestorTrail({
  ancestors,
  sideALabel,
  sideBLabel,
}: AncestorTrailProps) {
  if (ancestors.length === 0) return null;

  return (
    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-2">
      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
        <span>Thread context</span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {ancestors.map((ancestor, index) => (
          <div key={ancestor.id} className="flex items-center gap-1.5 shrink-0">
            {index > 0 && (
              <span className="text-gray-300 text-xs">&rsaquo;</span>
            )}
            <button
              onClick={() => scrollToComment(ancestor.id)}
              className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 hover:bg-gray-100 transition-colors max-w-[280px]"
            >
              <span className="font-medium text-xs text-gray-700 shrink-0">
                {ancestor.author.displayName}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1 py-0 shrink-0",
                  STANCE_COLORS[ancestor.stanceSide]
                )}
              >
                {getStanceLabel(
                  ancestor.stanceSide,
                  sideALabel,
                  sideBLabel
                )}
              </Badge>
              <span className="text-xs text-gray-500 truncate">
                {truncateContent(ancestor.content)}
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
