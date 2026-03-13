"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/time";
import type { CommentNode } from "@/types/comments";
import { CommentEditor } from "./comment-editor";
import { VoteButton } from "@/components/votes/vote-button";

const STANCE_COLORS: Record<string, string> = {
  side_a: "bg-blue-100 text-blue-800 border-blue-200",
  side_b: "bg-red-100 text-red-800 border-red-200",
  neutral: "bg-gray-100 text-gray-800 border-gray-200",
  meta: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

interface CommentCardProps {
  comment: CommentNode;
  debate: {
    id: string;
    slug: string;
    sideALabel: string;
    sideBLabel: string;
  };
  onReply: (comment: CommentNode) => void;
  onCommentAdded?: () => void;
  depth: number;
  activeReplyId: string | null;
  onSetActiveReply: (id: string | null) => void;
  highlightId?: string | null;
  isPromoted?: boolean;
  promotedIds?: Set<string>;
  isLastChild?: boolean;
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

function countDescendants(node: CommentNode): number {
  let count = node.children.length;
  for (const child of node.children) {
    count += countDescendants(child);
  }
  return count;
}

function scrollToComment(commentId: string) {
  const el = document.getElementById(`comment-${commentId}`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("comment-highlight");
    setTimeout(() => el.classList.remove("comment-highlight"), 2000);
  }
}

export function CommentCard({
  comment,
  debate,
  onReply,
  onCommentAdded,
  depth,
  activeReplyId,
  onSetActiveReply,
  highlightId,
  isPromoted,
  promotedIds,
  isLastChild,
}: CommentCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isQuarantineRevealed, setIsQuarantineRevealed] = useState(false);
  const commentRef = useRef<HTMLDivElement>(null);

  const showReplyEditor = activeReplyId === comment.id;
  const isHighlighted = highlightId === comment.id;

  // Cap visual indentation at depth 6
  const visualDepth = Math.min(depth, 6);

  const isGuest = !!comment.isGuestComment;
  const isDeleted =
    comment.status === "deleted_by_author" ||
    comment.status === "removed_by_mod";

  const handleReplySubmit = () => {
    onSetActiveReply(null);
    onCommentAdded?.();
  };

  const descendantCount = countDescendants(comment);

  // Scroll into view when highlighted
  useEffect(() => {
    if (isHighlighted && commentRef.current) {
      commentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      commentRef.current.classList.add("comment-highlight");
      const timer = setTimeout(() => {
        commentRef.current?.classList.remove("comment-highlight");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted]);

  const commentContent = (
    <div className="py-3 px-4">
      {/* Quarantined overlay */}
      {comment.isQuarantined && !isQuarantineRevealed ? (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          This comment has been flagged by the community.{" "}
          <button
            onClick={() => setIsQuarantineRevealed(true)}
            className="underline font-medium hover:text-amber-900 min-h-[44px] inline-flex items-center"
          >
            Click to read
          </button>
        </div>
      ) : (
        <>
          {/* Header: avatar, name, stance, time */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1 min-w-0">
            {/* Avatar */}
            {comment.author.avatarUrl ? (
              <img
                src={comment.author.avatarUrl}
                alt={comment.author.displayName}
                className="w-6 h-6 rounded-full shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
                {comment.author.displayName.charAt(0).toUpperCase()}
              </div>
            )}

            <span className="font-medium text-sm shrink-0">
              {comment.author.displayName}
            </span>

            <Badge
              variant="outline"
              className={cn(
                "text-xs px-1.5 py-0 max-w-[200px] sm:max-w-[300px] inline-block truncate align-middle shrink min-w-0",
                STANCE_COLORS[comment.stanceSide]
              )}
              title={getStanceLabel(
                comment.stanceSide,
                debate.sideALabel,
                debate.sideBLabel
              )}
            >
              {getStanceLabel(
                comment.stanceSide,
                debate.sideALabel,
                debate.sideBLabel
              )}
            </Badge>

            <span className="text-xs text-gray-500 shrink-0">
              {timeAgo(comment.createdAt)}
            </span>

            {isGuest && (
              <Badge
                variant="outline"
                className="text-xs px-1.5 py-0 bg-amber-50 border-amber-300 text-amber-700 shrink-0"
              >
                Pending — saved on login
              </Badge>
            )}

            {comment.status === "edited" && (
              <span className="text-xs text-gray-400 italic shrink-0">
                (edited{comment.editedAt ? ` ${timeAgo(comment.editedAt)}` : ""})
              </span>
            )}

            {isPromoted && (
              <Link href={`/d/${debate.slug}/sub/${comment.id}`}>
                <Badge
                  variant="outline"
                  className="text-xs px-1.5 py-0 bg-amber-50 border-amber-300 text-amber-700 shrink-0 hover:bg-amber-100 cursor-pointer"
                >
                  Sub-Debate
                </Badge>
              </Link>
            )}
          </div>

          {/* Content */}
          {isDeleted ? (
            <p className="text-sm text-gray-400 italic mt-1">
              {comment.status === "deleted_by_author"
                ? "[Comment deleted by author]"
                : "[Comment removed by moderator]"}
            </p>
          ) : (
            <div
              className="text-sm mt-1 prose prose-sm max-w-none break-words overflow-hidden"
              dangerouslySetInnerHTML={{ __html: comment.content }}
            />
          )}

          {/* Actions */}
          {!isDeleted && (
            <div className="flex items-center gap-2 mt-2">
              {!isGuest && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs min-h-[44px] px-2 text-gray-500 hover:text-gray-700"
                  onClick={() => onSetActiveReply(showReplyEditor ? null : comment.id)}
                >
                  Reply
                </Button>
              )}

              {depth > 0 && comment.parentId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs min-h-[44px] px-2 text-gray-500 hover:text-gray-700"
                  onClick={() => scrollToComment(comment.parentId!)}
                >
                  Parent
                </Button>
              )}

              {comment.children.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs min-h-[44px] px-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                >
                  {isCollapsed
                    ? `> ${descendantCount} ${descendantCount === 1 ? "reply" : "replies"}`
                    : "v Collapse"}
                </Button>
              )}

              {!isGuest && (
                <VoteButton
                  commentId={comment.id}
                  initialScore={comment.score}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* Inline reply editor */}
      {showReplyEditor && (
        <div className="mt-3 ml-4">
          <CommentEditor
            key={`reply-${comment.id}`}
            debateId={comment.debateId}
            debateSlug={debate.slug}
            sideALabel={debate.sideALabel}
            sideBLabel={debate.sideBLabel}
            parentId={comment.id}
            onSubmit={handleReplySubmit}
          />
        </div>
      )}
    </div>
  );

  return (
    <div
      id={`comment-${comment.id}`}
      ref={commentRef}
      className={cn(
        "group min-w-0 overflow-hidden",
        depth === 0 && "rounded-lg border border-border bg-card shadow-sm mb-4",
        isGuest && "border border-dashed border-amber-300 rounded-lg bg-amber-50/30"
      )}
    >
      {depth > 0 ? (
        <div className="flex">
          <div
            className="relative shrink-0 w-5"
            data-depth={visualDepth}
          >
            {/* Vertical thread line — stops at connector for last child */}
            <div className={cn(
              "thread-line absolute left-2 top-0 w-0.5",
              isLastChild ? "h-5" : "bottom-0"
            )} />
            {/* Horizontal connector */}
            <div className="thread-line absolute left-2 top-5 w-2.5 h-0.5" />
          </div>
          <div className="flex-1 min-w-0">
            {commentContent}
            {/* Children */}
            {!isCollapsed &&
              comment.children.map((child, i) => (
                <CommentCard
                  key={child.id}
                  comment={child}
                  debate={debate}
                  onReply={onReply}
                  onCommentAdded={onCommentAdded}
                  depth={depth + 1}
                  activeReplyId={activeReplyId}
                  onSetActiveReply={onSetActiveReply}
                  highlightId={highlightId}
                  isPromoted={promotedIds?.has(child.id)}
                  promotedIds={promotedIds}
                  isLastChild={i === comment.children.length - 1}
                />
              ))}
          </div>
        </div>
      ) : (
        <>
          {commentContent}
          {/* Children */}
          {!isCollapsed &&
            comment.children.map((child, i) => (
              <CommentCard
                key={child.id}
                comment={child}
                debate={debate}
                onReply={onReply}
                onCommentAdded={onCommentAdded}
                depth={depth + 1}
                activeReplyId={activeReplyId}
                onSetActiveReply={onSetActiveReply}
                highlightId={highlightId}
                isPromoted={promotedIds?.has(child.id)}
                promotedIds={promotedIds}
                isLastChild={i === comment.children.length - 1}
              />
            ))}
        </>
      )}
    </div>
  );
}
