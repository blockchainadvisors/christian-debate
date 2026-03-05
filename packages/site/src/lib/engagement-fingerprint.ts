import { db } from "@/db";
import {
  debateStances,
  stanceShifts,
  comments,
  votes,
  argumentTags,
} from "@/db/schema";
import { eq, and, sql, count } from "drizzle-orm";
import type { EngagementFingerprint, EngagementDepth } from "@/types/engagement";

const TAXONOMY_KEYS = [
  "empirical",
  "moral_ethical",
  "economic",
  "procedural",
  "anecdotal",
  "legal",
  "historical",
] as const;

const UPVOTE_REASON_KEYS = [
  "well_reasoned",
  "well_sourced",
  "changed_my_mind",
  "strong_counterpoint",
  "well_written",
] as const;

function stanceToNumber(stance: string): number {
  switch (stance) {
    case "side_a":
      return -1;
    case "side_b":
      return 1;
    case "neutral":
    default:
      return 0;
  }
}

function classifyDepth(avgDepth: number): EngagementDepth {
  if (avgDepth < 1) return "shallow";
  if (avgDepth <= 3) return "moderate";
  return "deep";
}

export async function computeEngagementFingerprint(
  userId: string
): Promise<EngagementFingerprint> {
  // 1. Debates engaged + avgStance
  const stances = await db
    .select({
      debateId: debateStances.debateId,
      declaredStance: debateStances.declaredStance,
    })
    .from(debateStances)
    .where(eq(debateStances.userId, userId));

  const debatesEngaged = stances.length;

  const avgStance =
    debatesEngaged > 0
      ? stances.reduce((sum, s) => sum + stanceToNumber(s.declaredStance), 0) /
        debatesEngaged
      : 0;

  // 2. Stance shifts
  const shiftsResult = await db
    .select({ total: count() })
    .from(stanceShifts)
    .where(eq(stanceShifts.userId, userId));

  const totalShifts = shiftsResult[0]?.total ?? 0;

  // 3. Debates with at least one shift (for consistency)
  const debatesWithShifts = await db
    .select({ debateId: stanceShifts.debateId })
    .from(stanceShifts)
    .where(eq(stanceShifts.userId, userId))
    .groupBy(stanceShifts.debateId);

  const debatesShiftedCount = debatesWithShifts.length;

  const stanceConsistency =
    debatesEngaged > 0 ? (debatesEngaged - debatesShiftedCount) / debatesEngaged : 1;

  const mindChangeRate = debatesEngaged > 0 ? totalShifts / debatesEngaged : 0;

  // 4. Argument style weights (taxonomy tags on user's comments)
  const taxonomyCounts = await db
    .select({
      taxonomy: argumentTags.taxonomy,
      cnt: count(),
    })
    .from(argumentTags)
    .innerJoin(comments, eq(argumentTags.commentId, comments.id))
    .where(eq(comments.authorId, userId))
    .groupBy(argumentTags.taxonomy);

  const taxonomyMap: Record<string, number> = {};
  let taxonomyTotal = 0;
  for (const row of taxonomyCounts) {
    taxonomyMap[row.taxonomy] = row.cnt;
    taxonomyTotal += row.cnt;
  }

  const argumentStyleWeights = Object.fromEntries(
    TAXONOMY_KEYS.map((key) => [
      key,
      taxonomyTotal > 0 ? (taxonomyMap[key] ?? 0) / taxonomyTotal : 0,
    ])
  ) as EngagementFingerprint["argumentStyleWeights"];

  // 5. Engagement depth (avg comment depth)
  const depthResult = await db
    .select({
      avgDepth: sql<number>`coalesce(avg(${comments.depth}), 0)`,
    })
    .from(comments)
    .where(eq(comments.authorId, userId));

  const avgDepth = Number(depthResult[0]?.avgDepth ?? 0);
  const engagementDepth = classifyDepth(avgDepth);

  // 6. Upvote reasons on user's comments (only direction = 'up')
  const upvoteReasonCounts = await db
    .select({
      reason: votes.reason,
      cnt: count(),
    })
    .from(votes)
    .innerJoin(comments, eq(votes.commentId, comments.id))
    .where(and(eq(comments.authorId, userId), eq(votes.direction, "up")))
    .groupBy(votes.reason);

  const upvoteMap: Record<string, number> = {};
  let upvoteTotal = 0;
  let persuasionScore = 0;

  for (const row of upvoteReasonCounts) {
    if (UPVOTE_REASON_KEYS.includes(row.reason as (typeof UPVOTE_REASON_KEYS)[number])) {
      upvoteMap[row.reason] = row.cnt;
      upvoteTotal += row.cnt;
    }
    if (row.reason === "changed_my_mind") {
      persuasionScore = row.cnt;
    }
  }

  const upvoteReasonProfile = Object.fromEntries(
    UPVOTE_REASON_KEYS.map((key) => [
      key,
      upvoteTotal > 0 ? (upvoteMap[key] ?? 0) / upvoteTotal : 0,
    ])
  ) as EngagementFingerprint["upvoteReasonProfile"];

  return {
    debatesEngaged,
    avgStance,
    stanceConsistency,
    mindChangeRate,
    argumentStyleWeights,
    engagementDepth,
    persuasionScore,
    upvoteReasonProfile,
    computedAt: new Date().toISOString(),
  };
}
