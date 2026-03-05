import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { debateStances, comments, votes, debates } from "@/db/schema";
import { redis } from "@/lib/redis";
import { computeAlgorithmicLean } from "@/lib/stance-detection";

const RATE_LIMIT_KEY = "job:compute-stances:lastRun";
const RATE_LIMIT_SECONDS = 300; // 5 minutes

export async function POST(request: NextRequest) {
  // Auth check
  const secret = request.headers.get("X-Job-Secret");
  if (!secret || secret !== process.env.JOB_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit check
  const lastRun = await redis.get(RATE_LIMIT_KEY);
  if (lastRun) {
    const elapsed = Date.now() - parseInt(lastRun, 10);
    if (elapsed < RATE_LIMIT_SECONDS * 1000) {
      return NextResponse.json(
        { error: "Rate limited", retryAfterSeconds: Math.ceil((RATE_LIMIT_SECONDS * 1000 - elapsed) / 1000) },
        { status: 429 }
      );
    }
  }

  // Set rate limit timestamp
  await redis.set(RATE_LIMIT_KEY, Date.now().toString(), "EX", RATE_LIMIT_SECONDS);

  let body: { debateId?: string } = {};
  try {
    body = await request.json();
  } catch {
    // No body or invalid JSON — process all open debates
  }

  // Find debates to process
  let debatesToProcess: { id: string }[];
  if (body.debateId) {
    debatesToProcess = [{ id: body.debateId }];
  } else {
    debatesToProcess = await db
      .select({ id: debates.id })
      .from(debates)
      .where(eq(debates.status, "open"));
  }

  let processed = 0;
  let updated = 0;

  for (const debate of debatesToProcess) {
    // Get all users with a declared stance in this debate
    const stances = await db
      .select({
        id: debateStances.id,
        userId: debateStances.userId,
        declaredStance: debateStances.declaredStance,
        algorithmicLean: debateStances.algorithmicLean,
        leanConfidence: debateStances.leanConfidence,
      })
      .from(debateStances)
      .where(eq(debateStances.debateId, debate.id));

    for (const stance of stances) {
      processed++;

      // Count comments by stance side for this user in this debate
      const commentCounts = await db
        .select({
          stanceSide: comments.stanceSide,
          count: sql<number>`count(*)::int`,
        })
        .from(comments)
        .where(
          and(
            eq(comments.debateId, debate.id),
            eq(comments.authorId, stance.userId)
          )
        )
        .groupBy(comments.stanceSide);

      const commentsByStance = { side_a: 0, side_b: 0, neutral: 0 };
      for (const row of commentCounts) {
        if (row.stanceSide === "side_a" || row.stanceSide === "side_b" || row.stanceSide === "neutral") {
          commentsByStance[row.stanceSide] = row.count;
        }
        // "meta" comments are ignored for stance detection
      }

      // Count votes by the comment's stance side for this user's votes in this debate
      const voteCounts = await db
        .select({
          stanceSide: comments.stanceSide,
          direction: votes.direction,
          count: sql<number>`count(*)::int`,
        })
        .from(votes)
        .innerJoin(comments, eq(votes.commentId, comments.id))
        .where(
          and(
            eq(comments.debateId, debate.id),
            eq(votes.userId, stance.userId)
          )
        )
        .groupBy(comments.stanceSide, votes.direction);

      const votesByStance = {
        side_a_up: 0,
        side_b_up: 0,
        side_a_down: 0,
        side_b_down: 0,
      };
      for (const row of voteCounts) {
        if (row.stanceSide === "side_a" && row.direction === "up") {
          votesByStance.side_a_up = row.count;
        } else if (row.stanceSide === "side_a" && row.direction === "down") {
          votesByStance.side_a_down = row.count;
        } else if (row.stanceSide === "side_b" && row.direction === "up") {
          votesByStance.side_b_up = row.count;
        } else if (row.stanceSide === "side_b" && row.direction === "down") {
          votesByStance.side_b_down = row.count;
        }
      }

      const result = computeAlgorithmicLean({ commentsByStance, votesByStance });

      // Only update if values changed
      if (
        stance.algorithmicLean !== result.lean ||
        stance.leanConfidence !== result.confidence
      ) {
        await db
          .update(debateStances)
          .set({
            algorithmicLean: result.lean,
            leanConfidence: result.confidence,
          })
          .where(eq(debateStances.id, stance.id));
        updated++;
      }
    }
  }

  return NextResponse.json({ processed, updated });
}
