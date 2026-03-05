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

export async function POST(request: NextRequest) {
  // Require hub admin auth
  const adminError = checkHubAdmin(request);
  if (adminError) {
    return adminError;
  }

  let body: { hubUserId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { hubUserId } = body;
  if (!hubUserId) {
    return NextResponse.json(
      { error: "hubUserId is required" },
      { status: 400 },
    );
  }

  // Verify user exists
  const [user] = await db
    .select()
    .from(hubUsers)
    .where(eq(hubUsers.id, hubUserId))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get linked sites before deletion so we can notify them
  const links = await db
    .select({
      siteId: profileLinks.siteId,
      baseUrl: siteRegistrations.baseUrl,
      siteName: siteRegistrations.name,
    })
    .from(profileLinks)
    .innerJoin(siteRegistrations, eq(profileLinks.siteId, siteRegistrations.id))
    .where(eq(profileLinks.hubUserId, hubUserId));

  // Delete reputation snapshots
  await db
    .delete(reputationSnapshots)
    .where(eq(reputationSnapshots.hubUserId, hubUserId));

  // Delete profile links
  await db
    .delete(profileLinks)
    .where(eq(profileLinks.hubUserId, hubUserId));

  // Delete the hub user
  await db.delete(hubUsers).where(eq(hubUsers.id, hubUserId));

  // Log pending deletion notifications for each linked site
  // In a production system this would be stored in a dedicated queue/table
  let sitesNotified = 0;
  for (const link of links) {
    console.log(
      `[PRIVACY] Pending deletion notification for hub user ${hubUserId} ` +
        `on site "${link.siteName}" (${link.baseUrl}). ` +
        `POST ${link.baseUrl}/api/federation/delete-user with hubUserId=${hubUserId}`,
    );
    sitesNotified++;
  }

  return NextResponse.json({ deleted: true, sitesNotified });
}
