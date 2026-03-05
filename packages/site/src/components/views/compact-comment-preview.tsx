"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StanceBadge } from "@/components/stances/stance-badge";
import type { CommentWithAuthor } from "@/types/comments";

interface CompactCommentPreviewProps {
  comment: CommentWithAuthor;
  debateSlug: string;
  sideALabel: string;
  sideBLabel: string;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "...";
}

function getStanceSideForBadge(
  side: CommentWithAuthor["stanceSide"]
): "side_a" | "side_b" | "neutral" {
  if (side === "meta") return "neutral";
  return side;
}

export function CompactCommentPreview({
  comment,
  debateSlug,
  sideALabel,
  sideBLabel,
}: CompactCommentPreviewProps) {
  return (
    <Card className="transition-colors hover:bg-muted/30">
      <CardContent className="p-4 space-y-3">
        {/* Author row */}
        <div className="flex items-center gap-2">
          {comment.author.avatarUrl ? (
            <img
              src={comment.author.avatarUrl}
              alt={comment.author.displayName}
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
              {comment.author.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm font-medium">
            {comment.author.displayName}
          </span>
          <StanceBadge
            declaredStance={getStanceSideForBadge(comment.stanceSide)}
            sideALabel={sideALabel}
            sideBLabel={sideBLabel}
          />
        </div>

        {/* Content */}
        <p className="text-sm leading-relaxed text-foreground/90">
          {truncate(comment.content, 200)}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Score: {comment.score}
          </span>
          <Button variant="ghost" size="sm" asChild>
            <Link
              href={`/d/${debateSlug}?view=thread&highlight=${comment.id}`}
            >
              View in Context
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
