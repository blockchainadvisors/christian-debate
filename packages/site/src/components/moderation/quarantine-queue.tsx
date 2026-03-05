"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModActions } from "@/components/moderation/mod-actions";

interface QuarantinedComment {
  id: string;
  content: string;
  quarantineReason: string | null;
  status: string;
  createdAt: string;
  debateId: string;
  debateTitle: string;
  debateSlug: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
}

export function QuarantineQueue() {
  const [comments, setComments] = useState<QuarantinedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/moderation/quarantined");
      if (!res.ok) {
        throw new Error("Failed to fetch quarantined comments");
      }
      const data = await res.json();
      setComments(data.comments);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handleAction(
    commentId: string,
    action: "approve" | "remove"
  ) {
    try {
      const res = await fetch(`/api/moderation/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        throw new Error(`Failed to ${action} comment`);
      }

      // Remove the comment from the list
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred"
      );
    }
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Loading quarantined comments...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-destructive">{error}</div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No quarantined comments to review.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {comments.length} comment{comments.length !== 1 ? "s" : ""} in
        quarantine
      </p>
      {comments.map((comment) => (
        <Card key={comment.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">
                  {comment.authorDisplayName}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    @{comment.authorUsername}
                  </span>
                </CardTitle>
                <CardDescription>
                  in{" "}
                  <a
                    href={`/debates/${comment.debateSlug}`}
                    className="underline hover:text-foreground"
                  >
                    {comment.debateTitle}
                  </a>
                  {" \u00B7 "}
                  {new Date(comment.createdAt).toLocaleString()}
                </CardDescription>
              </div>
              {comment.quarantineReason && (
                <Badge variant="destructive" className="shrink-0">
                  {comment.quarantineReason}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 whitespace-pre-wrap rounded bg-muted p-3 text-sm">
              {comment.content}
            </p>
            <ModActions commentId={comment.id} onAction={handleAction} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
