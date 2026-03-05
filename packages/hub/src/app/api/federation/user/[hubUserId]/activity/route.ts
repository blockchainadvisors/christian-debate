import { NextRequest, NextResponse } from "next/server";
import { verifySiteApiKey } from "@/lib/api-auth";
import { db } from "@/db";
import { profileLinks, siteRegistrations, reputationSnapshots } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hubUserId: string }> },
) {
  const auth = await verifySiteApiKey(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { hubUserId } = await params;

  // Get all profile links for this hub user, joined with site info
  const links = await db
    .select({
      siteId: profileLinks.siteId,
      localUserId: profileLinks.localUserId,
      visibility: profileLinks.visibility,
      siteName: siteRegistrations.name,
      siteUrl: siteRegistrations.baseUrl,
      trustStatus: siteRegistrations.trustStatus,
    })
    .from(profileLinks)
    .innerJoin(siteRegistrations, eq(profileLinks.siteId, siteRegistrations.id))
    .where(eq(profileLinks.hubUserId, hubUserId));

  // Check if the requesting site also has a link for this user (for mutual_only)
  const requestingSiteHasLink = links.some(
    (link) => link.siteId === auth.siteId,
  );

  const activities: Array<{
    siteId: string;
    siteName: string;
    siteUrl: string;
    debateCount: number;
    lastActive: string | null;
  }> = [];

  for (const link of links) {
    // Only include verified sites
    if (link.trustStatus !== "verified") continue;

    // Visibility check: public is always visible, mutual_only only if requesting site shares the user
    if (link.visibility === "private") continue;
    if (link.visibility === "mutual_only" && !requestingSiteHasLink) continue;

    // Get the latest reputation snapshot for debate count and last active
    const [snapshot] = await db
      .select({
        debateCount: reputationSnapshots.debateCount,
        snapshotAt: reputationSnapshots.snapshotAt,
      })
      .from(reputationSnapshots)
      .where(
        and(
          eq(reputationSnapshots.hubUserId, hubUserId),
          eq(reputationSnapshots.siteId, link.siteId),
        ),
      )
      .orderBy(desc(reputationSnapshots.snapshotAt))
      .limit(1);

    activities.push({
      siteId: link.siteId,
      siteName: link.siteName,
      siteUrl: link.siteUrl,
      debateCount: snapshot?.debateCount ?? 0,
      lastActive: snapshot?.snapshotAt?.toISOString() ?? null,
    });
  }

  return NextResponse.json({ activities });
}
