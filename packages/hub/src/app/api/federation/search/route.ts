import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { siteRegistrations } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/federation/search?q=...
 *
 * Public endpoint. Searches verified sites in the Agora network.
 * Without Meilisearch, this queries siteRegistrations as a placeholder.
 * In production, this would search a Meilisearch index of debates across sites.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 },
    );
  }

  const sites = await db
    .select({
      siteId: siteRegistrations.id,
      siteName: siteRegistrations.name,
      siteUrl: siteRegistrations.baseUrl,
      niche: siteRegistrations.niche,
    })
    .from(siteRegistrations)
    .where(eq(siteRegistrations.trustStatus, "verified"));

  // Filter in application layer for case-insensitive partial match
  // (works across all Postgres versions without needing ilike on all columns)
  const lowerQ = q.toLowerCase();
  const results = sites.filter(
    (s) =>
      s.siteName.toLowerCase().includes(lowerQ) ||
      (s.niche && s.niche.toLowerCase().includes(lowerQ)),
  );

  return NextResponse.json({ results });
}
