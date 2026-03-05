import { NextRequest, NextResponse } from "next/server";
import { verifySiteApiKey } from "@/lib/api-auth";
import { db } from "@/db";
import { profileLinks } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const auth = await verifySiteApiKey(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { hubUserId?: string; localUserId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { hubUserId, localUserId } = body;

  if (!hubUserId || !localUserId) {
    return NextResponse.json(
      { error: "hubUserId and localUserId are required" },
      { status: 400 },
    );
  }

  const [link] = await db
    .select({ id: profileLinks.id })
    .from(profileLinks)
    .where(
      and(
        eq(profileLinks.hubUserId, hubUserId),
        eq(profileLinks.siteId, auth.siteId),
        eq(profileLinks.localUserId, localUserId),
      ),
    )
    .limit(1);

  return NextResponse.json({ valid: !!link });
}
