import { db } from "@/db";
import { reputationSnapshots, hubUsers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

const SITE_WEIGHTS = [1.0, 0.6, 0.4, 0.2];

/**
 * Aggregate reputation for a hub user across all sites using diminishing returns.
 *
 * Algorithm:
 * 1. Get the latest reputation snapshot per site for this user.
 * 2. Sort sites by reputationScore descending.
 * 3. Apply weights: site 1 (highest) = 1.0, site 2 = 0.6, site 3 = 0.4, site 4+ = 0.2.
 * 4. Return the weighted sum (rounded to integer).
 */
export async function aggregateReputation(
  hubUserId: string,
): Promise<number> {
  // Get all snapshots for this user, ordered by site and time
  const snapshots = await db
    .select({
      siteId: reputationSnapshots.siteId,
      reputationScore: reputationSnapshots.reputationScore,
      snapshotAt: reputationSnapshots.snapshotAt,
    })
    .from(reputationSnapshots)
    .where(eq(reputationSnapshots.hubUserId, hubUserId))
    .orderBy(desc(reputationSnapshots.snapshotAt));

  // Get the latest snapshot per site
  const latestBySite = new Map<string, number>();
  for (const snap of snapshots) {
    if (!latestBySite.has(snap.siteId)) {
      latestBySite.set(snap.siteId, snap.reputationScore);
    }
  }

  // Sort sites by reputation score descending
  const scores = Array.from(latestBySite.values()).sort((a, b) => b - a);

  // Apply diminishing returns weights
  let weightedSum = 0;
  for (let i = 0; i < scores.length; i++) {
    const weight = i < SITE_WEIGHTS.length ? SITE_WEIGHTS[i] : SITE_WEIGHTS[SITE_WEIGHTS.length - 1];
    weightedSum += scores[i] * weight;
  }

  return Math.round(weightedSum);
}

/**
 * Recompute and persist the global reputation score for a hub user.
 */
export async function updateGlobalReputation(
  hubUserId: string,
): Promise<number> {
  const score = await aggregateReputation(hubUserId);

  await db
    .update(hubUsers)
    .set({ globalReputationScore: score, updatedAt: new Date() })
    .where(eq(hubUsers.id, hubUserId));

  return score;
}
