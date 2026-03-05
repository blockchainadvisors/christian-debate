"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CompactCommentPreview } from "@/components/views/compact-comment-preview";
import type { CommentWithAuthor } from "@/types/comments";

interface Debate {
  slug: string;
  sideALabel: string;
  sideBLabel: string;
}

interface SidesViewProps {
  debate: Debate;
}

interface SidesData {
  sideA: CommentWithAuthor[];
  sideB: CommentWithAuthor[];
  neutral: CommentWithAuthor[];
}

function CommentList({
  comments,
  debateSlug,
  sideALabel,
  sideBLabel,
  emptyMessage,
}: {
  comments: CommentWithAuthor[];
  debateSlug: string;
  sideALabel: string;
  sideBLabel: string;
  emptyMessage: string;
}) {
  if (comments.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <CompactCommentPreview
          key={comment.id}
          comment={comment}
          debateSlug={debateSlug}
          sideALabel={sideALabel}
          sideBLabel={sideBLabel}
        />
      ))}
    </div>
  );
}

export function SidesView({ debate }: SidesViewProps) {
  const [data, setData] = useState<SidesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [neutralOpen, setNeutralOpen] = useState(false);

  useEffect(() => {
    async function fetchSides() {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/debates/${encodeURIComponent(debate.slug)}/comments/by-side`
        );
        if (!res.ok) {
          throw new Error("Failed to load comments");
        }
        const json: SidesData = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchSides();
  }, [debate.slug]);

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Loading sides...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-sm text-destructive">{error}</div>
    );
  }

  if (!data) return null;

  // Desktop layout (md+)
  const desktopView = (
    <div className="hidden md:block space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Side A Column */}
        <div>
          <div className="mb-4 rounded-lg bg-blue-50 px-4 py-2 dark:bg-blue-950">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200">
              {debate.sideALabel}
            </h3>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {data.sideA.length} argument{data.sideA.length !== 1 ? "s" : ""}
            </p>
          </div>
          <CommentList
            comments={data.sideA}
            debateSlug={debate.slug}
            sideALabel={debate.sideALabel}
            sideBLabel={debate.sideBLabel}
            emptyMessage="No arguments for this side yet."
          />
        </div>

        {/* Side B Column */}
        <div>
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 dark:bg-red-950">
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
              {debate.sideBLabel}
            </h3>
            <p className="text-xs text-red-600 dark:text-red-400">
              {data.sideB.length} argument{data.sideB.length !== 1 ? "s" : ""}
            </p>
          </div>
          <CommentList
            comments={data.sideB}
            debateSlug={debate.slug}
            sideALabel={debate.sideALabel}
            sideBLabel={debate.sideBLabel}
            emptyMessage="No arguments for this side yet."
          />
        </div>
      </div>

      {/* Neutral / Meta section */}
      <div className="border-t pt-4">
        <Button
          variant="ghost"
          className="w-full justify-between"
          onClick={() => setNeutralOpen(!neutralOpen)}
        >
          <span className="text-sm font-medium">
            Neutral / Meta ({data.neutral.length})
          </span>
          <span className="text-xs text-muted-foreground">
            {neutralOpen ? "Hide" : "Show"}
          </span>
        </Button>
        {neutralOpen && (
          <div className="mt-4">
            <CommentList
              comments={data.neutral}
              debateSlug={debate.slug}
              sideALabel={debate.sideALabel}
              sideBLabel={debate.sideBLabel}
              emptyMessage="No neutral or meta comments yet."
            />
          </div>
        )}
      </div>
    </div>
  );

  // Mobile layout (< md)
  const mobileView = (
    <div className="md:hidden">
      <Tabs defaultValue="side_a">
        <TabsList className="w-full">
          <TabsTrigger value="side_a">{debate.sideALabel}</TabsTrigger>
          <TabsTrigger value="side_b">{debate.sideBLabel}</TabsTrigger>
          <TabsTrigger value="neutral">Neutral</TabsTrigger>
        </TabsList>

        <TabsContent value="side_a" className="mt-4">
          <CommentList
            comments={data.sideA}
            debateSlug={debate.slug}
            sideALabel={debate.sideALabel}
            sideBLabel={debate.sideBLabel}
            emptyMessage="No arguments for this side yet."
          />
        </TabsContent>

        <TabsContent value="side_b" className="mt-4">
          <CommentList
            comments={data.sideB}
            debateSlug={debate.slug}
            sideALabel={debate.sideALabel}
            sideBLabel={debate.sideBLabel}
            emptyMessage="No arguments for this side yet."
          />
        </TabsContent>

        <TabsContent value="neutral" className="mt-4">
          <CommentList
            comments={data.neutral}
            debateSlug={debate.slug}
            sideALabel={debate.sideALabel}
            sideBLabel={debate.sideBLabel}
            emptyMessage="No neutral or meta comments yet."
          />
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <>
      {desktopView}
      {mobileView}
    </>
  );
}
