import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { hubUsers, profileLinks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { verifySiteApiKey } from "@/lib/api-auth";

const VALID_VISIBILITIES = ["public", "mutual_only", "private"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ hubUserId: string }> },
) {
  const { hubUserId } = await params;

  // Require site API key auth
  const siteAuth = await verifySiteApiKey(request);
  if (!siteAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    profileVisibility?: string;
    siteVisibilities?: Array<{ siteId: string; visibility: string }>;
  };
  try {
    body = await request.clone().json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { profileVisibility, siteVisibilities } = body;

  // Validate profileVisibility if provided
  if (
    profileVisibility &&
    !VALID_VISIBILITIES.includes(profileVisibility as (typeof VALID_VISIBILITIES)[number])
  ) {
    return NextResponse.json(
      { error: "Invalid profileVisibility value" },
      { status: 400 },
    );
  }

  // Validate siteVisibilities if provided
  if (siteVisibilities) {
    for (const sv of siteVisibilities) {
      if (!sv.siteId || !sv.visibility) {
        return NextResponse.json(
          { error: "Each siteVisibility must have siteId and visibility" },
          { status: 400 },
        );
      }
      if (
        !VALID_VISIBILITIES.includes(sv.visibility as (typeof VALID_VISIBILITIES)[number])
      ) {
        return NextResponse.json(
          { error: `Invalid visibility value: ${sv.visibility}` },
          { status: 400 },
        );
      }
    }
  }

  // Update hub user's profileVisibility
  if (profileVisibility) {
    const [updated] = await db
      .update(hubUsers)
      .set({ profileVisibility: profileVisibility as (typeof VALID_VISIBILITIES)[number] })
      .where(eq(hubUsers.id, hubUserId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
  }

  // Update individual site link visibilities
  const updatedLinks: Array<{ siteId: string; visibility: string }> = [];
  if (siteVisibilities) {
    for (const sv of siteVisibilities) {
      const [updated] = await db
        .update(profileLinks)
        .set({ visibility: sv.visibility as (typeof VALID_VISIBILITIES)[number] })
        .where(
          and(
            eq(profileLinks.hubUserId, hubUserId),
            eq(profileLinks.siteId, sv.siteId),
          ),
        )
        .returning();

      if (updated) {
        updatedLinks.push({ siteId: updated.siteId, visibility: updated.visibility });
      }
    }
  }

  return NextResponse.json({
    profileVisibility: profileVisibility ?? undefined,
    updatedLinks,
  });
}
