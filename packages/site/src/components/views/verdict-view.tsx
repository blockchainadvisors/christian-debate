"use client";

import { useState, useEffect, useCallback } from "react";
import { useVerdictStream } from "@/hooks/use-verdict-stream";
import { VerdictTallyBar } from "@/components/views/verdict-tally-bar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { VerdictTally, PinnedComment, VerdictResponse } from "@/types/verdict";

function pickBestTally(a: VerdictTally | null, b: VerdictTally | null): VerdictTally | null {
  if (!a) return b;
  if (!b) return a;
  // Prefer whichever has more voters (SSE live data will always be >= REST cached data)
  return a.totalVoters >= b.totalVoters ? a : b;
}

interface DebateInfo {
  slug: string;
  sideALabel: string;
  sideBLabel: string;
  status: string;
}

interface VerdictViewProps {
  debate: DebateInfo;
}

export function VerdictView({ debate }: VerdictViewProps) {
  const { tally: streamTally, isConnected } = useVerdictStream(debate.slug);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [filteredTally, setFilteredTally] = useState<VerdictTally | null>(null);
  const [pinnedComments, setPinnedComments] = useState<PinnedComment[]>([]);
  const [winningSide, setWinningSide] = useState<string>("");
  const [pinnedCommentId, setPinnedCommentId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canVote, setCanVote] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVerdict = useCallback(async () => {
    try {
      const url = `/api/debates/${debate.slug}/verdict${verifiedOnly ? "?verifiedOnly=true" : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        const data: VerdictResponse = await res.json();
        setFilteredTally(data.tally);
        setPinnedComments(data.pinnedComments);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, [debate.slug, verifiedOnly]);

  // Fetch data when verifiedOnly changes or on mount
  useEffect(() => {
    fetchVerdict();
  }, [fetchVerdict]);

  // Show whichever source has more data; REST loads fast, SSE upgrades with live updates
  const displayTally = verifiedOnly
    ? filteredTally
    : pickBestTally(streamTally, filteredTally);

  const handleSubmitVote = async () => {
    if (!winningSide) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/debates/${debate.slug}/verdict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          winningSide,
          pinnedCommentId: pinnedCommentId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit vote");
        if (res.status === 403) {
          setCanVote(false);
        }
      } else {
        const data: VerdictResponse = await res.json();
        setFilteredTally(data.tally);
        setPinnedComments(data.pinnedComments);
        setError(null);
      }
    } catch {
      setError("Failed to submit vote");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero: Tally Bar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Verdict</CardTitle>
            <div className="flex items-center gap-2">
              {isConnected && (
                <Badge variant="outline" className="text-green-600 border-green-300">
                  Live
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {displayTally ? (
            <VerdictTallyBar
              tally={displayTally}
              sideALabel={debate.sideALabel}
              sideBLabel={debate.sideBLabel}
            />
          ) : isLoading ? (
            <div className="flex h-10 w-full items-center justify-center rounded-lg bg-muted animate-pulse" />
          ) : (
            <div className="flex h-10 w-full items-center justify-center rounded-lg bg-muted text-muted-foreground text-sm">
              No verdict data yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats + Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            {displayTally?.totalVoters ?? 0} neutral voter{(displayTally?.totalVoters ?? 0) !== 1 ? "s" : ""}
          </span>
          <Separator orientation="vertical" className="h-4" />
          <span>
            {displayTally?.verifiedNeutralCount ?? 0} verified neutral{(displayTally?.verifiedNeutralCount ?? 0) !== 1 ? "s" : ""}
          </span>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          Verified Neutrals Only
        </label>
      </div>

      {/* Decisive Comments */}
      {pinnedComments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Decisive Comments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pinnedComments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-lg border p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {comment.author.avatarUrl && (
                      <img
                        src={comment.author.avatarUrl}
                        alt=""
                        className="h-6 w-6 rounded-full"
                      />
                    )}
                    <span className="text-sm font-medium">
                      {comment.author.displayName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      @{comment.author.username}
                    </span>
                  </div>
                  <Badge variant="secondary">
                    Pinned {comment.pinCount}x
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed">{comment.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Cast Vote Form */}
      {debate.status === "open" && canVote !== false && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cast Your Verdict</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Only neutral participants can vote. Select who you think won the debate.
            </p>

            <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
              <div className="space-y-2 min-w-0">
                <label className="text-sm font-medium">Winning Side</label>
                <Select value={winningSide} onValueChange={setWinningSide}>
                  <SelectTrigger className="w-full [&>span]:truncate [&>span]:text-left">
                    <SelectValue placeholder="Select winner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="side_a">{debate.sideALabel}</SelectItem>
                    <SelectItem value="side_b">{debate.sideBLabel}</SelectItem>
                    <SelectItem value="draw">Draw</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 min-w-0">
                <label className="text-sm font-medium">
                  Pin a Decisive Comment <span className="text-muted-foreground">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Comment ID"
                  value={pinnedCommentId}
                  onChange={(e) => setPinnedCommentId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleSubmitVote}
                  disabled={!winningSide || isSubmitting}
                  className="whitespace-nowrap"
                >
                  {isSubmitting ? "Submitting..." : "Submit Vote"}
                </Button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
