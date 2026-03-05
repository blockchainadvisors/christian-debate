import { eq, and, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, comments } from "@/db/schema";

type ComputedTier = "new" | "established" | "trusted";

export async function computeTrustTier(
  userId: string
): Promise<ComputedTier> {
  // Fetch user
  const [user] = await db
    .select({
      createdAt: users.createdAt,
      reputationScore: users.reputationScore,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return "new";

  const accountAgeDays =
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);

  // Count total comments
  const [totalResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(comments)
    .where(eq(comments.authorId, userId));

  const totalComments = totalResult?.count ?? 0;

  // "new" if account age < 7 days OR total comments < 5
  if (accountAgeDays < 7 || totalComments < 5) {
    return "new";
  }

  // Count net-positive comments (score > 0)
  const [positiveResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(comments)
    .where(and(eq(comments.authorId, userId), gt(comments.score, 0)));

  const netPositiveComments = positiveResult?.count ?? 0;

  // Check "trusted" first (more restrictive)
  if (
    accountAgeDays >= 30 &&
    netPositiveComments >= 25 &&
    user.reputationScore >= 50
  ) {
    // Check quarantine rate < 5%
    if (totalComments > 0) {
      const [quarantinedResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(comments)
        .where(
          and(
            eq(comments.authorId, userId),
            eq(comments.isQuarantined, true)
          )
        );

      const quarantinedCount = quarantinedResult?.count ?? 0;
      const quarantineRate = quarantinedCount / totalComments;

      if (quarantineRate < 0.05) {
        return "trusted";
      }
    }
  }

  // Check "established"
  if (accountAgeDays >= 7 && netPositiveComments >= 10) {
    return "established";
  }

  return "new";
}

const TIER_ORDER: Record<string, number> = {
  new: 0,
  established: 1,
  trusted: 2,
  moderator: 3,
  admin: 4,
};

export async function refreshUserTrustTier(userId: string): Promise<void> {
  // Get current tier
  const [user] = await db
    .select({ trustTier: users.trustTier })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return;

  // Don't touch moderator/admin
  if (user.trustTier === "moderator" || user.trustTier === "admin") {
    return;
  }

  const computedTier = await computeTrustTier(userId);

  // Only upgrade, never downgrade
  if (TIER_ORDER[computedTier] > TIER_ORDER[user.trustTier]) {
    await db
      .update(users)
      .set({ trustTier: computedTier })
      .where(eq(users.id, userId));
  }
}
