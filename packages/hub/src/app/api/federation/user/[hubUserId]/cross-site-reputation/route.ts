import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  hubUsers,
  reputationSnapshots,
  profileLinks,
  siteRegistrations,
} from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { verifySiteApiKey } from "@/lib/api-auth";
import { checkHubAdmin } from "@/lib/auth";

interface SiteBreakdownEntry {
  siteName: string;
  reputationScore: number;
  persuasionRating: number;
  commentCount: number;
  debateCount: number;
  snapshotAt: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hubUserId: string }> },
) {
  const { hubUserId } = await params;

  // Auth: site API key OR hub admin
  const siteAuth = await verifySiteApiKey(request);
  const adminError = checkHubAdmin(request);
  const isAdmin = adminError === null;

  if (!siteAuth && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestingSiteId = siteAuth?.siteId ?? null;

  try {
    // Get the hub user
    const [user] = await db
      .select({ globalReputationScore: hubUsers.globalReputationScore })
      .from(hubUsers)
      .where(eq(hubUsers.id, hubUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all profile links for this user (to check visibility)
    const links = await db
      .select({
        siteId: profileLinks.siteId,
        visibility: profileLinks.visibility,
      })
      .from(profileLinks)
      .where(eq(profileLinks.hubUserId, hubUserId));

    // Determine which sites the requesting site participates in
    // (for mutual_only visibility check)
    let requestingSiteUserLinks: Set<string> | null = null;
    if (requestingSiteId) {
      // Get all sites where the requesting site has profile links
      // (i.e., sites the requesting site's users participate in)
      requestingSiteUserLinks = new Set(
        links
          .filter((l) => l.siteId === requestingSiteId)
          .map((l) => l.siteId),
      );
    }

    // Build visibility map: siteId -> visibility
    const visibilityMap = new Map<string, string>();
    for (const link of links) {
      visibilityMap.set(link.siteId, link.visibility);
    }

    // Determine visible site IDs
    const visibleSiteIds = new Set<string>();
    for (const [siteId, visibility] of visibilityMap) {
      if (isAdmin) {
        // Hub admin can see everything
        visibleSiteIds.add(siteId);
      } else if (visibility === "public") {
        visibleSiteIds.add(siteId);
      } else if (visibility === "mutual_only" && requestingSiteId) {
        // mutual_only: visible if the requesting site is one the user participates in
        // Check if the user has a profile link to the requesting site
        const userSiteIds = new Set(links.map((l) => l.siteId));
        if (userSiteIds.has(requestingSiteId)) {
          visibleSiteIds.add(siteId);
        }
      }
      // "private" is never visible to other sites
    }

    // Get the latest snapshot per visible site
    const allSnapshots = await db
      .select({
        siteId: reputationSnapshots.siteId,
        reputationScore: reputationSnapshots.reputationScore,
        persuasionRating: reputationSnapshots.persuasionRating,
        commentCount: reputationSnapshots.commentCount,
        debateCount: reputationSnapshots.debateCount,
        snapshotAt: reputationSnapshots.snapshotAt,
      })
      .from(reputationSnapshots)
      .where(eq(reputationSnapshots.hubUserId, hubUserId))
      .orderBy(desc(reputationSnapshots.snapshotAt));

    // Latest snapshot per site, filtered by visibility
    const latestBySite = new Map<string, (typeof allSnapshots)[number]>();
    for (const snap of allSnapshots) {
      if (visibleSiteIds.has(snap.siteId) && !latestBySite.has(snap.siteId)) {
        latestBySite.set(snap.siteId, snap);
      }
    }

    // Get site names
    const siteIds = [...latestBySite.keys()];
    const sites =
      siteIds.length > 0
        ? await db
            .select({ id: siteRegistrations.id, name: siteRegistrations.name })
            .from(siteRegistrations)
        : [];

    const siteNameMap = new Map<string, string>();
    for (const site of sites) {
      siteNameMap.set(site.id, site.name);
    }

    // Build breakdown
    const siteBreakdown: SiteBreakdownEntry[] = [];
    let totalMindsChanged = 0;

    for (const [siteId, snap] of latestBySite) {
      siteBreakdown.push({
        siteName: siteNameMap.get(siteId) ?? "Unknown Site",
        reputationScore: snap.reputationScore,
        persuasionRating: snap.persuasionRating,
        commentCount: snap.commentCount,
        debateCount: snap.debateCount,
        snapshotAt: snap.snapshotAt.toISOString(),
      });
      totalMindsChanged += snap.persuasionRating;
    }

    return NextResponse.json({
      globalReputationScore: user.globalReputationScore,
      siteBreakdown,
      totalMindsChanged,
    });
  } catch (error) {
    console.error("Failed to fetch cross-site reputation:", error);
    return NextResponse.json(
      { error: "Failed to fetch cross-site reputation" },
      { status: 500 },
    );
  }
}
