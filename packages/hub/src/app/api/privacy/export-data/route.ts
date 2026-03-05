import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  hubUsers,
  profileLinks,
  reputationSnapshots,
  siteRegistrations,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkHubAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  // Require hub admin auth
  const adminError = checkHubAdmin(request);
  if (adminError) {
    return adminError;
  }

  const hubUserId = request.nextUrl.searchParams.get("hubUserId");
  if (!hubUserId) {
    return NextResponse.json(
      { error: "hubUserId query parameter is required" },
      { status: 400 },
    );
  }

  // Fetch hub user
  const [user] = await db
    .select()
    .from(hubUsers)
    .where(eq(hubUsers.id, hubUserId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Fetch linked sites
  const links = await db
    .select({
      id: profileLinks.id,
      siteId: profileLinks.siteId,
      localUserId: profileLinks.localUserId,
      visibility: profileLinks.visibility,
      linkedAt: profileLinks.linkedAt,
      siteName: siteRegistrations.name,
      siteSlug: siteRegistrations.slug,
      siteBaseUrl: siteRegistrations.baseUrl,
    })
    .from(profileLinks)
    .innerJoin(siteRegistrations, eq(profileLinks.siteId, siteRegistrations.id))
    .where(eq(profileLinks.hubUserId, hubUserId));

  // Fetch reputation snapshots
  const snapshots = await db
    .select()
    .from(reputationSnapshots)
    .where(eq(reputationSnapshots.hubUserId, hubUserId));

  const exportData = {
    exportedAt: new Date().toISOString(),
    profile: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      globalReputationScore: user.globalReputationScore,
      profileVisibility: user.profileVisibility,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    linkedSites: links.map((link) => ({
      linkId: link.id,
      siteId: link.siteId,
      siteName: link.siteName,
      siteSlug: link.siteSlug,
      siteBaseUrl: link.siteBaseUrl,
      localUserId: link.localUserId,
      visibility: link.visibility,
      linkedAt: link.linkedAt,
    })),
    reputationSnapshots: snapshots.map((snap) => ({
      id: snap.id,
      siteId: snap.siteId,
      reputationScore: snap.reputationScore,
      persuasionRating: snap.persuasionRating,
      commentCount: snap.commentCount,
      debateCount: snap.debateCount,
      snapshotAt: snap.snapshotAt,
    })),
  };

  const json = JSON.stringify(exportData, null, 2);
  const filename = `hub-user-data-${hubUserId}-${Date.now()}.json`;

  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
