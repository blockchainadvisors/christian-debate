import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { federatedIdentity } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * PATCH /api/federation/visibility
 * Updates the user's per-site visibility on the hub.
 * Proxies the request to the hub's visibility endpoint.
 */
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hubUrl = process.env.AGORA_HUB_URL;
  if (!hubUrl) {
    return NextResponse.json(
      { error: "Agora Network is not configured" },
      { status: 503 },
    );
  }

  // Get the user's hub link
  const [link] = await db
    .select()
    .from(federatedIdentity)
    .where(eq(federatedIdentity.localUserId, session.user.id))
    .limit(1);

  if (!link) {
    return NextResponse.json(
      { error: "Account is not linked to Agora Network" },
      { status: 404 },
    );
  }

  let body: { visibility?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { visibility } = body;
  if (!visibility || !["public", "mutual_only", "private"].includes(visibility)) {
    return NextResponse.json(
      { error: "Invalid visibility value" },
      { status: 400 },
    );
  }

  // Build the request to the hub
  const siteId = process.env.AGORA_SITE_ID;
  const apiKey = process.env.AGORA_API_KEY;

  if (!siteId || !apiKey) {
    return NextResponse.json(
      { error: "Federation credentials not configured" },
      { status: 503 },
    );
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const hubBody = JSON.stringify({
    siteVisibilities: [{ siteId, visibility }],
  });

  // Compute HMAC signature
  const { createHmac } = await import("node:crypto");
  const signature = createHmac("sha256", apiKey)
    .update(hubBody + timestamp)
    .digest("hex");

  try {
    const hubRes = await fetch(
      `${hubUrl}/api/profiles/${link.hubUserId}/visibility`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Agora-Site-Id": siteId,
          "X-Agora-Timestamp": timestamp,
          "X-Agora-Signature": signature,
        },
        body: hubBody,
      },
    );

    if (!hubRes.ok) {
      const error = await hubRes.text();
      console.error("Hub visibility update failed:", error);
      return NextResponse.json(
        { error: "Failed to update visibility on hub" },
        { status: hubRes.status },
      );
    }

    const result = await hubRes.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to contact hub:", error);
    return NextResponse.json(
      { error: "Failed to contact Agora Hub" },
      { status: 502 },
    );
  }
}
