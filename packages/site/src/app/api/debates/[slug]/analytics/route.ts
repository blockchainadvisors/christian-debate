import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { redis } from "@/lib/redis";
import {
  debates,
  comments,
  votes,
  debateStances,
  stanceShifts,
  argumentTags,
  users,
} from "@/db/schema";
import { eq, sql, and, count, avg, desc } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Find the debate by slug
  const debate = await db
    .select({ id: debates.id })
    .from(debates)
    .where(eq(debates.slug, slug))
    .limit(1);

  if (debate.length === 0) {
    return NextResponse.json({ error: "Debate not found" }, { status: 404 });
  }

  const debateId = debate[0].id;
  const cacheKey = `debate:${debateId}:analytics`;

  // Check Redis cache
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached));
    }
  } catch {
    // Redis unavailable, continue without cache
  }

  // Fetch all analytics in parallel
  const [
    stanceTimeline,
    voteReasonBreakdown,
    persuasionLeaderboard,
    taxonomyBreakdown,
    engagementDepth,
    summaryData,
  ] = await Promise.all([
    // 1. Stance Timeline — daily counts of stance declarations
    db
      .select({
        date: sql<string>`date(${debateStances.declaredAt})`.as("date"),
        declaredStance: debateStances.declaredStance,
        count: count().as("count"),
      })
      .from(debateStances)
      .where(eq(debateStances.debateId, debateId))
      .groupBy(
        sql`date(${debateStances.declaredAt})`,
        debateStances.declaredStance
      )
      .orderBy(sql`date(${debateStances.declaredAt})`),

    // 2. Vote Reason Breakdown
    db
      .select({
        reason: votes.reason,
        count: count().as("count"),
      })
      .from(votes)
      .innerJoin(comments, eq(votes.commentId, comments.id))
      .where(eq(comments.debateId, debateId))
      .groupBy(votes.reason)
      .orderBy(desc(count())),

    // 3. Persuasion Leaderboard — top 10 by changed_my_mind upvotes received
    db
      .select({
        userId: comments.authorId,
        displayName: users.displayName,
        username: users.username,
        count: count().as("count"),
      })
      .from(votes)
      .innerJoin(comments, eq(votes.commentId, comments.id))
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(
        and(
          eq(comments.debateId, debateId),
          eq(votes.direction, "up"),
          eq(votes.reason, "changed_my_mind")
        )
      )
      .groupBy(comments.authorId, users.displayName, users.username)
      .orderBy(desc(count()))
      .limit(10),

    // 4. Taxonomy Breakdown
    db
      .select({
        taxonomy: argumentTags.taxonomy,
        avgScore: avg(comments.score).as("avg_score"),
        count: count().as("count"),
      })
      .from(argumentTags)
      .innerJoin(comments, eq(argumentTags.commentId, comments.id))
      .where(eq(comments.debateId, debateId))
      .groupBy(argumentTags.taxonomy)
      .orderBy(desc(count())),

    // 5. Engagement Depth histogram
    db
      .select({
        depth: sql<number>`LEAST(${comments.depth}, 6)`.as("capped_depth"),
        count: count().as("count"),
      })
      .from(comments)
      .where(eq(comments.debateId, debateId))
      .groupBy(sql`LEAST(${comments.depth}, 6)`)
      .orderBy(sql`LEAST(${comments.depth}, 6)`),

    // 6. Summary stats
    Promise.all([
      db
        .select({ count: count() })
        .from(comments)
        .where(eq(comments.debateId, debateId)),
      db
        .select({ count: count() })
        .from(votes)
        .innerJoin(comments, eq(votes.commentId, comments.id))
        .where(eq(comments.debateId, debateId)),
      db
        .select({
          count:
            sql<number>`count(distinct ${comments.authorId})`.as("count"),
        })
        .from(comments)
        .where(eq(comments.debateId, debateId)),
      db
        .select({ avg: avg(comments.score) })
        .from(comments)
        .where(eq(comments.debateId, debateId)),
      db
        .select({ count: count() })
        .from(stanceShifts)
        .where(eq(stanceShifts.debateId, debateId)),
    ]),
  ]);

  // Transform stance timeline into grouped-by-date format
  const timelineMap = new Map<
    string,
    { sideA: number; sideB: number; neutral: number }
  >();
  for (const row of stanceTimeline) {
    if (!timelineMap.has(row.date)) {
      timelineMap.set(row.date, { sideA: 0, sideB: 0, neutral: 0 });
    }
    const entry = timelineMap.get(row.date)!;
    if (row.declaredStance === "side_a") entry.sideA = Number(row.count);
    else if (row.declaredStance === "side_b") entry.sideB = Number(row.count);
    else if (row.declaredStance === "neutral") entry.neutral = Number(row.count);
  }
  const stanceTimelineFormatted = Array.from(timelineMap.entries()).map(
    ([date, counts]) => ({ date, ...counts })
  );

  // Transform taxonomy breakdown
  const taxonomyFormatted = taxonomyBreakdown.map((row) => ({
    taxonomy: row.taxonomy,
    avgScore: Number(row.avgScore) || 0,
    count: Number(row.count),
  }));

  // Transform engagement depth
  const engagementDepthFormatted = engagementDepth.map((row) => ({
    depth: Number(row.depth),
    count: Number(row.count),
  }));

  // Build summary
  const [totalComments, totalVotes, totalParticipants, avgScore, shiftCount] =
    summaryData;
  const summary = {
    totalComments: Number(totalComments[0].count),
    totalVotes: Number(totalVotes[0].count),
    totalParticipants: Number(totalParticipants[0].count),
    avgCommentScore: Number(Number(avgScore[0].avg || 0).toFixed(1)),
    stanceShiftCount: Number(shiftCount[0].count),
  };

  const analytics = {
    stanceTimeline: stanceTimelineFormatted,
    voteReasonBreakdown: voteReasonBreakdown.map((r) => ({
      reason: r.reason,
      count: Number(r.count),
    })),
    persuasionLeaderboard: persuasionLeaderboard.map((r) => ({
      userId: r.userId,
      displayName: r.displayName,
      username: r.username,
      count: Number(r.count),
    })),
    taxonomyBreakdown: taxonomyFormatted,
    engagementDepth: engagementDepthFormatted,
    summary,
  };

  // Cache in Redis with 120s TTL
  try {
    await redis.set(cacheKey, JSON.stringify(analytics), "EX", 120);
  } catch {
    // Redis unavailable, continue without caching
  }

  return NextResponse.json(analytics);
}
