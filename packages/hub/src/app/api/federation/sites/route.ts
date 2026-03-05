import { NextRequest, NextResponse } from "next/server";
import { verifySiteApiKey } from "@/lib/api-auth";
import { db } from "@/db";
import { siteRegistrations } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  // Allow both authenticated and unauthenticated access
  // Auth is optional for this endpoint (basic public listing)
  await verifySiteApiKey(request).catch(() => null);

  const sites = await db
    .select({
      id: siteRegistrations.id,
      name: siteRegistrations.name,
      slug: siteRegistrations.slug,
      baseUrl: siteRegistrations.baseUrl,
      niche: siteRegistrations.niche,
    })
    .from(siteRegistrations)
    .where(eq(siteRegistrations.trustStatus, "verified"));

  return NextResponse.json({ sites });
}
