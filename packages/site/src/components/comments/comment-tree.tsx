"use client";

import { useMemo, useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { buildCommentTree } from "@/types/comments";
import type { CommentWithAuthor, CommentNode } from "@/types/comments";
import { CommentCard } from "./comment-card";

interface CommentTreeProps {
  comments: CommentWithAuthor[];
  debate: {
    id: string;
    slug: string;
    sideALabel: string;
    sideBLabel: string;
  };
  onCommentAdded?: () => void;
}

/**
 * Flatten the tree into a list of root-level nodes for virtualization.
 * Each root node and its subtree is treated as one virtualizable unit.
 */
function flattenRoots(tree: CommentNode[]): CommentNode[] {
  return tree;
}

export function CommentTree({
  comments,
  debate,
  onCommentAdded,
}: CommentTreeProps) {
  const tree = useMemo(() => buildCommentTree(comments), [comments]);
  const roots = useMemo(() => flattenRoots(tree), [tree]);
  const parentRef = useRef<HTMLDivElement>(null);
  const useVirtual = comments.length > 50;

  const handleReply = useCallback((_comment: CommentNode) => {
    // Reply handling is done inline via CommentCard
  }, []);

  const virtualizer = useVirtualizer({
    count: roots.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 150,
    overscan: 5,
    enabled: useVirtual,
  });

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No comments yet. Be the first to share your perspective.
      </div>
    );
  }

  // Non-virtualized rendering for smaller comment sets
  if (!useVirtual) {
    return (
      <div className="divide-y divide-gray-100">
        {roots.map((node) => (
          <CommentCard
            key={node.id}
            comment={node}
            debate={debate}
            onReply={handleReply}
            onCommentAdded={onCommentAdded}
            depth={0}
          />
        ))}
      </div>
    );
  }

  // Virtualized rendering for large comment sets
  return (
    <div
      ref={parentRef}
      className="overflow-auto"
      style={{ maxHeight: "80vh" }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const node = roots[virtualItem.index];
          return (
            <div
              key={node.id}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <CommentCard
                comment={node}
                debate={debate}
                onReply={handleReply}
                onCommentAdded={onCommentAdded}
                depth={0}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
