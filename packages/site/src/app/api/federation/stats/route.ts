import { NextRequest, NextResponse } from "next/server";
import { verifyHubRequest } from "@/lib/federation-auth";
import { db } from "@/db";
import { users, debates, comments, votes } from "@/db/schema";
import { count, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  if (!verifyHubRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    [{ value: totalUsers }],
    [{ value: totalDebates }],
    [{ value: totalComments }],
    [{ value: totalVotes }],
    [{ value: activeDebates }],
  ] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(debates),
    db.select({ value: count() }).from(comments),
    db.select({ value: count() }).from(votes),
    db.select({ value: count() }).from(debates).where(eq(debates.status, "open")),
  ]);

  return NextResponse.json({
    totalUsers,
    totalDebates,
    totalComments,
    totalVotes,
    activeDebates,
  });
}
