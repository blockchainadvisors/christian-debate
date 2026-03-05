import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { hubUsers, profileLinks, siteRegistrations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkHubAdmin } from "@/lib/auth";
import { verifySiteApiKey } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hubUserId: string }> },
) {
  const { hubUserId } = await params;

  // Require either hub admin auth or site API key auth
  const isAdmin = checkHubAdmin(request);
  const siteAuth = !isAdmin ? await verifySiteApiKey(request) : null;

  if (!isAdmin && !siteAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch the hub user
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
    })
    .from(profileLinks)
    .innerJoin(siteRegistrations, eq(profileLinks.siteId, siteRegistrations.id))
    .where(eq(profileLinks.hubUserId, hubUserId));

  // Filter linked sites based on visibility when requested by a site (not admin)
  const filteredLinks = isAdmin
    ? links
    : links.filter((link) => {
        // A site can always see its own link
        if (siteAuth && link.siteId === siteAuth.siteId) return true;
        // Public links are visible to everyone
        if (link.visibility === "public") return true;
        // Mutual only: visible if the requesting site is also linked
        if (link.visibility === "mutual_only" && siteAuth) {
          return links.some((l) => l.siteId === siteAuth.siteId);
        }
        // Private links are hidden from other sites
        return false;
      });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    profileVisibility: user.profileVisibility,
    globalReputationScore: user.globalReputationScore,
    createdAt: user.createdAt,
    linkedSites: filteredLinks,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ hubUserId: string }> },
) {
  const { hubUserId } = await params;

  // Require hub admin auth for PATCH (or the user themselves, but for now admin-only)
  const isAdmin = checkHubAdmin(request);
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { displayName?: string; profileVisibility?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.displayName) updates.displayName = body.displayName;
  if (body.profileVisibility) {
    if (!["public", "mutual_only", "private"].includes(body.profileVisibility)) {
      return NextResponse.json(
        { error: "Invalid profileVisibility value" },
        { status: 400 },
      );
    }
    updates.profileVisibility = body.profileVisibility;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(hubUsers)
    .set(updates)
    .where(eq(hubUsers.id, hubUserId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
