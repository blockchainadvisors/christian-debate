"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/time";
import type { CommentNode } from "@/types/comments";
import { CommentEditor } from "./comment-editor";

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

export function CommentCard({
  comment,
  debate,
  onReply,
  onCommentAdded,
  depth,
}: CommentCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isQuarantineRevealed, setIsQuarantineRevealed] = useState(false);
  const [showReplyEditor, setShowReplyEditor] = useState(false);

  // Cap visual indentation at depth 6
  const visualDepth = Math.min(depth, 6);

  const isDeleted =
    comment.status === "deleted_by_author" ||
    comment.status === "removed_by_mod";
  const isQuarantinedAndHidden = comment.isQuarantined && !isQuarantineRevealed;

  const handleReplySubmit = () => {
    setShowReplyEditor(false);
    onCommentAdded?.();
  };

  return (
    <div
      id={`comment-${comment.id}`}
      className={cn("group", depth > 0 && "border-l-2 border-gray-200")}
      style={{ marginLeft: `${visualDepth * 12}px` }}
    >
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
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {/* Avatar */}
              {comment.author.avatarUrl ? (
                <img
                  src={comment.author.avatarUrl}
                  alt={comment.author.displayName}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
                  {comment.author.displayName.charAt(0).toUpperCase()}
                </div>
              )}

              <span className="font-medium text-sm">
                {comment.author.displayName}
              </span>

              <Badge
                variant="outline"
                className={cn(
                  "text-xs px-1.5 py-0",
                  STANCE_COLORS[comment.stanceSide]
                )}
              >
                {getStanceLabel(
                  comment.stanceSide,
                  debate.sideALabel,
                  debate.sideBLabel
                )}
              </Badge>

              <span className="text-xs text-gray-500">
                {timeAgo(comment.createdAt)}
              </span>

              {comment.status === "edited" && (
                <span className="text-xs text-gray-400 italic">
                  (edited{comment.editedAt ? ` ${timeAgo(comment.editedAt)}` : ""})
                </span>
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
                className="text-sm mt-1 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: comment.content }}
              />
            )}

            {/* Actions */}
            {!isDeleted && (
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs min-h-[44px] px-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowReplyEditor(!showReplyEditor)}
                >
                  Reply
                </Button>

                {comment.children.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs min-h-[44px] px-2 text-gray-500 hover:text-gray-700"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                  >
                    {isCollapsed
                      ? `Show ${comment.children.length} ${comment.children.length === 1 ? "reply" : "replies"}`
                      : "Collapse"}
                  </Button>
                )}

                <span className="text-xs text-gray-400">
                  {comment.score > 0 ? `+${comment.score}` : comment.score}{" "}
                  points
                </span>
              </div>
            )}
          </>
        )}

        {/* Inline reply editor */}
        {showReplyEditor && (
          <div className="mt-3 ml-4">
            <CommentEditor
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

      {/* Children */}
      {!isCollapsed &&
        comment.children.map((child) => (
          <CommentCard
            key={child.id}
            comment={child}
            debate={debate}
            onReply={onReply}
            onCommentAdded={onCommentAdded}
            depth={depth + 1}
          />
        ))}
    </div>
  );
}
