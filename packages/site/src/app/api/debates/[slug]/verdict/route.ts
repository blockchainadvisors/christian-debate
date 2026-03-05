import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  debates,
  debateStances,
  verdictVotes,
  comments,
  users,
} from "@/db/schema";
import { eq, and, sql, count, desc, lt, isNull, or, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redis } from "@/lib/redis";
import type { VerdictTally, PinnedComment, VerdictResponse } from "@/types/verdict";

async function getDebateBySlug(slug: string) {
  const [debate] = await db
    .select()
    .from(debates)
    .where(eq(debates.slug, slug))
    .limit(1);
  return debate;
}

async function getVerdictTally(
  debateId: string,
  verifiedOnly: boolean
): Promise<VerdictResponse> {
  // Get verified neutral user IDs for this debate
  const verifiedNeutrals = await db
    .select({ userId: debateStances.userId })
    .from(debateStances)
    .where(
      and(
        eq(debateStances.debateId, debateId),
        eq(debateStances.declaredStance, "neutral"),
        or(
          isNull(debateStances.algorithmicLean),
          eq(debateStances.algorithmicLean, "neutral"),
          eq(debateStances.algorithmicLean, "mixed")
        ),
        or(
          isNull(debateStances.leanConfidence),
          lt(debateStances.leanConfidence, 0.3)
        )
      )
    );

  const verifiedNeutralIds = verifiedNeutrals.map((v) => v.userId);

  // Build vote query base
  const voteFilter = verifiedOnly && verifiedNeutralIds.length > 0
    ? and(
        eq(verdictVotes.debateId, debateId),
        inArray(verdictVotes.voterId, verifiedNeutralIds)
      )
    : verifiedOnly && verifiedNeutralIds.length === 0
    ? // No verified neutrals exist, return empty tally
      undefined
    : eq(verdictVotes.debateId, debateId);

  if (!voteFilter) {
    return {
      tally: {
        sideA: 0,
        sideB: 0,
        draw: 0,
        totalVoters: 0,
        verifiedNeutralCount: verifiedNeutralIds.length,
      },
      pinnedComments: [],
    };
  }

  // Count votes by winning side
  const voteCounts = await db
    .select({
      winningSide: verdictVotes.winningSide,
      count: count(),
    })
    .from(verdictVotes)
    .where(voteFilter)
    .groupBy(verdictVotes.winningSide);

  const tally: VerdictTally = {
    sideA: 0,
    sideB: 0,
    draw: 0,
    totalVoters: 0,
    verifiedNeutralCount: verifiedNeutralIds.length,
  };

  for (const row of voteCounts) {
    if (row.winningSide === "side_a") tally.sideA = row.count;
    else if (row.winningSide === "side_b") tally.sideB = row.count;
    else if (row.winningSide === "draw") tally.draw = row.count;
  }
  tally.totalVoters = tally.sideA + tally.sideB + tally.draw;

  // Get top 5 pinned comments
  const pinnedQuery = verifiedOnly && verifiedNeutralIds.length > 0
    ? and(
        eq(verdictVotes.debateId, debateId),
        sql`${verdictVotes.pinnedCommentId} IS NOT NULL`,
        inArray(verdictVotes.voterId, verifiedNeutralIds)
      )
    : and(
        eq(verdictVotes.debateId, debateId),
        sql`${verdictVotes.pinnedCommentId} IS NOT NULL`
      );

  const pinnedResults = await db
    .select({
      pinnedCommentId: verdictVotes.pinnedCommentId,
      pinCount: count(),
    })
    .from(verdictVotes)
    .where(pinnedQuery)
    .groupBy(verdictVotes.pinnedCommentId)
    .orderBy(desc(count()))
    .limit(5);

  const pinnedComments: PinnedComment[] = [];

  if (pinnedResults.length > 0) {
    const commentIds = pinnedResults
      .map((r) => r.pinnedCommentId)
      .filter((id): id is string => id !== null);

    if (commentIds.length > 0) {
      const commentRows = await db
        .select({
          comment: comments,
          author: {
            id: users.id,
            displayName: users.displayName,
            username: users.username,
            avatarUrl: users.avatarUrl,
          },
        })
        .from(comments)
        .innerJoin(users, eq(comments.authorId, users.id))
        .where(inArray(comments.id, commentIds));

      const commentMap = new Map(
        commentRows.map((r) => [
          r.comment.id,
          {
            ...r.comment,
            createdAt: r.comment.createdAt.toISOString(),
            editedAt: r.comment.editedAt?.toISOString() ?? null,
            author: r.author,
          },
        ])
      );

      for (const pinned of pinnedResults) {
        const comment = commentMap.get(pinned.pinnedCommentId!);
        if (comment) {
          pinnedComments.push({
            ...comment,
            pinCount: pinned.pinCount,
          });
        }
      }
    }
  }

  return { tally, pinnedComments };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const verifiedOnly = searchParams.get("verifiedOnly") === "true";

  const debate = await getDebateBySlug(slug);
  if (!debate) {
    return NextResponse.json({ error: "Debate not found" }, { status: 404 });
  }

  const cacheKey = `debate:${debate.id}:verdict${verifiedOnly ? ":verified" : ""}`;

  // Try Redis cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return NextResponse.json(JSON.parse(cached));
  }

  const result = await getVerdictTally(debate.id, verifiedOnly);

  // Cache for 30 seconds
  await redis.set(cacheKey, JSON.stringify(result), "EX", 30);

  return NextResponse.json(result);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const debate = await getDebateBySlug(slug);
  if (!debate) {
    return NextResponse.json({ error: "Debate not found" }, { status: 404 });
  }

  const body = await request.json();
  const { winningSide, pinnedCommentId } = body;

  if (!winningSide || !["side_a", "side_b", "draw"].includes(winningSide)) {
    return NextResponse.json(
      { error: "Invalid winningSide. Must be side_a, side_b, or draw." },
      { status: 400 }
    );
  }

  // Check user has a declared stance
  const [stance] = await db
    .select()
    .from(debateStances)
    .where(
      and(
        eq(debateStances.debateId, debate.id),
        eq(debateStances.userId, userId)
      )
    )
    .limit(1);

  if (!stance) {
    return NextResponse.json(
      { error: "You must declare a stance before voting on the verdict." },
      { status: 403 }
    );
  }

  if (stance.declaredStance !== "neutral") {
    return NextResponse.json(
      { error: "Only neutral participants can vote on the verdict." },
      { status: 403 }
    );
  }

  // Upsert verdict vote
  await db
    .insert(verdictVotes)
    .values({
      debateId: debate.id,
      voterId: userId,
      winningSide,
      voterStance: stance.declaredStance,
      pinnedCommentId: pinnedCommentId ?? null,
    })
    .onConflictDoUpdate({
      target: [verdictVotes.debateId, verdictVotes.voterId],
      set: {
        winningSide,
        pinnedCommentId: pinnedCommentId ?? null,
      },
    });

  // Invalidate cache
  await redis.del(`debate:${debate.id}:verdict`);
  await redis.del(`debate:${debate.id}:verdict:verified`);

  const result = await getVerdictTally(debate.id, false);

  // Re-cache
  await redis.set(
    `debate:${debate.id}:verdict`,
    JSON.stringify(result),
    "EX",
    30
  );

  return NextResponse.json(result);
}
