import { NextResponse } from "next/server";
import { db } from "@/db";
import { siteRegistrations, profileLinks, reputationSnapshots } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * In-memory cache for network stats.
 * Refreshes at most once every 60 seconds.
 */
let cachedStats: {
  data: Record<string, number>;
  fetchedAt: number;
} | null = null;

const CACHE_TTL_MS = 60_000; // 1 minute

/**
 * GET /api/federation/network-stats
 *
 * Public endpoint. Returns aggregate network statistics:
 * - totalVerifiedSites: number of verified site registrations
 * - totalLinkedUsers: number of unique hub users with profile links
 * - totalReputationSnapshots: total reputation snapshot records
 */
export async function GET() {
  const now = Date.now();

  if (cachedStats && now - cachedStats.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(cachedStats.data);
  }

  const [[sitesResult], [usersResult], [snapshotsResult]] = await Promise.all([
    db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(siteRegistrations)
      .where(eq(siteRegistrations.trustStatus, "verified")),
    db
      .select({
        count: sql<number>`COUNT(DISTINCT ${profileLinks.hubUserId})::int`,
      })
      .from(profileLinks),
    db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(reputationSnapshots),
  ]);

  const data = {
    totalVerifiedSites: sitesResult.count,
    totalLinkedUsers: usersResult.count,
    totalReputationSnapshots: snapshotsResult.count,
  };

  cachedStats = { data, fetchedAt: now };

  return NextResponse.json(data);
}
