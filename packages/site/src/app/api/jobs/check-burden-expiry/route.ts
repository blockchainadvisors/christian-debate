import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { burdenOfProofRequests } from "@/db/schema";
import { eq, and, lt, sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  // Protect with X-Job-Secret header
  const jobSecret = request.headers.get("X-Job-Secret");
  if (!jobSecret || jobSecret !== process.env.JOB_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);

  // Find all pending burden requests older than 72 hours and dismiss them
  const expired = await db
    .update(burdenOfProofRequests)
    .set({
      status: "dismissed",
      resolvedAt: new Date(),
    })
    .where(
      and(
        eq(burdenOfProofRequests.status, "pending"),
        lt(burdenOfProofRequests.createdAt, seventyTwoHoursAgo)
      )
    )
    .returning();

  return NextResponse.json({ expired: expired.length });
}
