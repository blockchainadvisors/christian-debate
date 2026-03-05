import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { votes, comments, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { redis } from "@/lib/redis";
import {
  UPVOTE_REASONS,
  DOWNVOTE_REASONS,
  TRUST_TIER_WEIGHTS,
  computeCommentScore,
} from "@/lib/vote-scoring";
import type { VoteBreakdown, VoteDirection, VoteReason } from "@/types/votes";

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: commentId } = await params;

  const body = await request.json();
  const { direction, reason } = body as {
    direction: VoteDirection;
    reason: VoteReason;
  };

  // Validate direction
  if (direction !== "up" && direction !== "down") {
    return NextResponse.json(
      { error: "Invalid vote direction" },
      { status: 400 }
    );
  }

  // Validate reason belongs to correct category
  if (direction === "up" && !UPVOTE_REASONS.includes(reason as any)) {
    return NextResponse.json(
      { error: "Invalid reason for upvote" },
      { status: 400 }
    );
  }
  if (direction === "down" && !DOWNVOTE_REASONS.includes(reason as any)) {
    return NextResponse.json(
      { error: "Invalid reason for downvote" },
      { status: 400 }
    );
  }

  // Look up user's trust tier to compute weight
  const [user] = await db
    .select({ trustTier: users.trustTier })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const weight = TRUST_TIER_WEIGHTS[user.trustTier] ?? 1.0;

  // Upsert vote
  await db
    .insert(votes)
    .values({
      commentId,
      userId: session.user.id,
      direction,
      reason,
      weight,
    })
    .onConflictDoUpdate({
      target: [votes.userId, votes.commentId],
      set: {
        direction,
        reason,
        weight,
        createdAt: new Date(),
      },
    });

  // Recompute score from all votes on this comment
  const allVotes = await db
    .select({
      direction: votes.direction,
      reason: votes.reason,
      weight: votes.weight,
    })
    .from(votes)
    .where(eq(votes.commentId, commentId));

  const newScore = computeCommentScore(allVotes);

  await db
    .update(comments)
    .set({ score: newScore })
    .where(eq(comments.id, commentId));

  // Build and cache breakdown
  const breakdown = await computeBreakdown(commentId);

  const cacheKey = `comment:${commentId}:votes`;
  await redis.set(cacheKey, JSON.stringify(breakdown), "EX", 60);

  return NextResponse.json({
    breakdown,
    userVote: { direction, reason },
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: commentId } = await params;

  // Delete the user's vote
  await db
    .delete(votes)
    .where(
      and(eq(votes.commentId, commentId), eq(votes.userId, session.user.id))
    );

  // Recompute score
  const allVotes = await db
    .select({
      direction: votes.direction,
      reason: votes.reason,
      weight: votes.weight,
    })
    .from(votes)
    .where(eq(votes.commentId, commentId));

  const newScore = computeCommentScore(allVotes);

  await db
    .update(comments)
    .set({ score: newScore })
    .where(eq(comments.id, commentId));

  // Rebuild and cache breakdown
  const breakdown = await computeBreakdown(commentId);

  const cacheKey = `comment:${commentId}:votes`;
  await redis.set(cacheKey, JSON.stringify(breakdown), "EX", 60);

  return NextResponse.json({
    breakdown,
    userVote: null,
  });
}
