import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  hubUsers,
  reputationSnapshots,
  profileLinks,
} from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

/**
 * GET /api/federation/leaderboard
 *
 * Public endpoint. Returns the top 20 most persuasive users across all sites.
 * Aggregates persuasionRating per hubUser from the latest reputation snapshot
 * per (hubUser, site) pair. Only includes users with public profileVisibility.
 */
export async function GET(_request: NextRequest) {
  // Subquery: get the latest snapshot per (hubUser, site)
  const latestSnapshots = db
    .select({
      hubUserId: reputationSnapshots.hubUserId,
      siteId: reputationSnapshots.siteId,
      persuasionRating: reputationSnapshots.persuasionRating,
      reputationScore: reputationSnapshots.reputationScore,
      snapshotAt: sql<Date>`MAX(${reputationSnapshots.snapshotAt})`.as(
        "max_snapshot_at",
      ),
    })
    .from(reputationSnapshots)
    .groupBy(
      reputationSnapshots.hubUserId,
      reputationSnapshots.siteId,
      reputationSnapshots.persuasionRating,
      reputationSnapshots.reputationScore,
    )
    .as("latest_snapshots");

  // For simplicity with Drizzle, use a raw SQL approach for the
  // "latest per group" pattern and aggregation
  const leaderboard = await db.execute(sql`
    WITH latest_per_site AS (
      SELECT DISTINCT ON (hub_user_id, site_id)
        hub_user_id,
        site_id,
        persuasion_rating,
        reputation_score
      FROM reputation_snapshots
      ORDER BY hub_user_id, site_id, snapshot_at DESC
    ),
    aggregated AS (
      SELECT
        lps.hub_user_id,
        SUM(lps.persuasion_rating)::int AS total_persuasion_rating,
        COUNT(DISTINCT lps.site_id)::int AS sites_active,
        SUM(lps.reputation_score)::int AS total_reputation_score
      FROM latest_per_site lps
      GROUP BY lps.hub_user_id
    )
    SELECT
      a.hub_user_id AS "hubUserId",
      hu.display_name AS "displayName",
      hu.avatar_url AS "avatarUrl",
      a.total_persuasion_rating AS "totalPersuasionRating",
      a.sites_active AS "sitesActive",
      hu.global_reputation_score AS "globalReputationScore"
    FROM aggregated a
    JOIN hub_users hu ON hu.id = a.hub_user_id
    WHERE hu.profile_visibility = 'public'
    ORDER BY a.total_persuasion_rating DESC
    LIMIT 20
  `);

  return NextResponse.json({ leaderboard });
}
