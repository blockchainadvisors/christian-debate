import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redis } from "@/lib/redis";
import { computeEngagementFingerprint } from "@/lib/engagement-fingerprint";

const RATE_LIMIT_KEY = "job:compute-fingerprints:last-run";
const RATE_LIMIT_SECONDS = 30 * 60; // 30 minutes

export async function POST(request: NextRequest) {
  // Auth check
  const secret = request.headers.get("X-Job-Secret");
  if (!secret || secret !== process.env.JOB_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit check
  const lastRun = await redis.get(RATE_LIMIT_KEY);
  if (lastRun) {
    const elapsed = Date.now() - Number(lastRun);
    if (elapsed < RATE_LIMIT_SECONDS * 1000) {
      return NextResponse.json(
        {
          error: "Rate limited",
          retryAfterSeconds: Math.ceil(
            (RATE_LIMIT_SECONDS * 1000 - elapsed) / 1000
          ),
        },
        { status: 429 }
      );
    }
  }

  // Mark as running
  await redis.set(RATE_LIMIT_KEY, Date.now().toString(), "EX", RATE_LIMIT_SECONDS);

  let body: { userId?: string } = {};
  try {
    body = await request.json();
  } catch {
    // No body or invalid JSON — process all users
  }

  let targetUsers: { id: string }[];

  if (body.userId) {
    targetUsers = [{ id: body.userId }];
  } else {
    targetUsers = await db
      .select({ id: users.id })
      .from(users);
  }

  let processed = 0;

  for (const user of targetUsers) {
    try {
      const fingerprint = await computeEngagementFingerprint(user.id);
      await db
        .update(users)
        .set({ engagementFingerprint: fingerprint })
        .where(eq(users.id, user.id));
      processed++;
    } catch (err) {
      console.error(
        `Failed to compute fingerprint for user ${user.id}:`,
        err
      );
    }
  }

  return NextResponse.json({ processed });
}
