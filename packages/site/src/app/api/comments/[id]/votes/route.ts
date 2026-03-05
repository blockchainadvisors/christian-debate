import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { votes } from "@/db/schema";
import { auth } from "@/lib/auth";
import { redis } from "@/lib/redis";
import {
  UPVOTE_REASONS,
  DOWNVOTE_REASONS,
  computeCommentScore,
} from "@/lib/vote-scoring";
import type { VoteBreakdown, VoteResponse } from "@/types/votes";

async function computeBreakdown(commentId: string): Promise<VoteBreakdown> {
  const allVotes = await db
    .select({
      direction: votes.direction,
      reason: votes.reason,
      weight: votes.weight,
    })
    .from(votes)
    .where(eq(votes.commentId, commentId));

  const breakdown: VoteBreakdown = {
    up: {},
    down: {},
    totalScore: 0,
  };

  for (const reason of UPVOTE_REASONS) {
    breakdown.up[reason] = 0;
  }
  for (const reason of DOWNVOTE_REASONS) {
    breakdown.down[reason] = 0;
  }

  for (const vote of allVotes) {
    if (vote.direction === "up") {
      breakdown.up[vote.reason] = (breakdown.up[vote.reason] ?? 0) + 1;
    } else {
      breakdown.down[vote.reason] = (breakdown.down[vote.reason] ?? 0) + 1;
    }
  }

  breakdown.totalScore = computeCommentScore(allVotes);

  return breakdown;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: commentId } = await params;

  // Try Redis cache first
  const cacheKey = `comment:${commentId}:votes`;
  const cached = await redis.get(cacheKey);

  let breakdown: VoteBreakdown;

  if (cached) {
    breakdown = JSON.parse(cached);
  } else {
    breakdown = await computeBreakdown(commentId);
    await redis.set(cacheKey, JSON.stringify(breakdown), "EX", 60);
  }

  // Check if user is authenticated and get their vote
  const session = await auth();
  let userVote = null;

  if (session?.user?.id) {
    const [existingVote] = await db
      .select({
        direction: votes.direction,
        reason: votes.reason,
      })
      .from(votes)
      .where(
        and(eq(votes.commentId, commentId), eq(votes.userId, session.user.id))
      )
      .limit(1);

    if (existingVote) {
      userVote = {
        direction: existingVote.direction,
        reason: existingVote.reason,
      };
    }
  }

  const response: VoteResponse = {
    breakdown,
    userVote,
  };

  return NextResponse.json(response);
}
