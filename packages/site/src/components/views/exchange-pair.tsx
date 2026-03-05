"use client";

import Link from "next/link";
import type { ExchangePair } from "@/types/exchanges";
import type { CommentWithAuthor } from "@/types/comments";
import { StanceBadge } from "@/components/stances/stance-badge";
import { cn } from "@/lib/utils";

interface ExchangePairCardProps {
  exchange: ExchangePair;
  sideALabel: string;
  sideBLabel: string;
  debateSlug: string;
}

function CommentCard({
  comment,
  sideALabel,
  sideBLabel,
}: {
  comment: CommentWithAuthor;
  sideALabel: string;
  sideBLabel: string;
}) {
  const stanceForBadge =
    comment.stanceSide === "meta" ? "neutral" : comment.stanceSide;

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-card p-4">
      <div className="flex items-center gap-2">
        {comment.author.avatarUrl ? (
          <img
            src={comment.author.avatarUrl}
            alt={comment.author.displayName}
            className="h-6 w-6 rounded-full"
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
          declaredStance={stanceForBadge}
          sideALabel={sideALabel}
          sideBLabel={sideBLabel}
        />
        <span className="ml-auto text-xs text-muted-foreground">
          {comment.score} pts
        </span>
      </div>
      <p className="text-sm leading-relaxed">{comment.content}</p>
    </div>
  );
}

export function ExchangePairCard({
  exchange,
  sideALabel,
  sideBLabel,
  debateSlug,
}: ExchangePairCardProps) {
  const isChain = exchange.comments.length > 2;
  const firstCommentId = exchange.comments[0]?.id;

  return (
    <div className="rounded-xl border border-transparent bg-gradient-to-r from-blue-500/10 via-transparent to-red-500/10 p-[1px]">
      <div className="rounded-[11px] bg-background p-4">
        {/* Score badge */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Exchange Score: {exchange.pairScore}
          </span>
          <Link
            href={`/d/${debateSlug}?view=thread&highlight=${firstCommentId}`}
            className="text-xs text-primary hover:underline"
          >
            View in Thread
          </Link>
        </div>

        {/* Comments layout */}
        {isChain ? (
          /* Chain: stacked vertically with connectors */
          <div className="flex flex-col gap-0">
            {exchange.comments.map((comment, i) => (
              <div key={comment.id}>
                <CommentCard
                  comment={comment}
                  sideALabel={sideALabel}
                  sideBLabel={sideBLabel}
                />
                {i < exchange.comments.length - 1 && (
                  <div className="flex justify-center py-1">
                    <div className="h-4 w-px bg-border" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Pair: side by side on desktop, stacked on mobile */
          <>
            {/* Desktop: two columns */}
            <div className="hidden gap-4 md:grid md:grid-cols-2">
              {exchange.comments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  sideALabel={sideALabel}
                  sideBLabel={sideBLabel}
                />
              ))}
            </div>
            {/* Mobile: stacked with connector */}
            <div className="flex flex-col gap-0 md:hidden">
              {exchange.comments.map((comment, i) => (
                <div key={comment.id}>
                  <CommentCard
                    comment={comment}
                    sideALabel={sideALabel}
                    sideBLabel={sideBLabel}
                  />
                  {i < exchange.comments.length - 1 && (
                    <div className="flex justify-center py-1">
                      <div className="h-4 w-px bg-border" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
