import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { profileLinks } from "@/db/schema";
import { verifySiteApiKey } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  // Authenticate the calling site
  const siteAuth = await verifySiteApiKey(request);
  if (!siteAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { hubUserId?: string; siteId?: string; localUserId?: string };
  try {
    body = await request.clone().json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { hubUserId, siteId, localUserId } = body;

  if (!hubUserId || !siteId || !localUserId) {
    return NextResponse.json(
      { error: "hubUserId, siteId, and localUserId are required" },
      { status: 400 },
    );
  }

  // Ensure the siteId in the body matches the authenticated site
  if (siteId !== siteAuth.siteId) {
    return NextResponse.json(
      { error: "siteId does not match authenticated site" },
      { status: 403 },
    );
  }

  try {
    const [record] = await db
      .insert(profileLinks)
      .values({
        hubUserId,
        siteId,
        localUserId,
      })
      .onConflictDoUpdate({
        target: [profileLinks.hubUserId, profileLinks.siteId],
        set: { localUserId },
      })
      .returning();

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Failed to create profile link:", error);
    return NextResponse.json(
      { error: "Failed to create profile link" },
      { status: 500 },
    );
  }
}
