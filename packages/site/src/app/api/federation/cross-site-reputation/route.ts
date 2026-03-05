import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchCrossSiteReputation } from "@/lib/hub-client";

/**
 * GET /api/federation/cross-site-reputation?hubUserId=...
 *
 * Client-facing endpoint that proxies cross-site reputation data from the Hub.
 * Requires user authentication.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hubUserId = request.nextUrl.searchParams.get("hubUserId");
  if (!hubUserId) {
    return NextResponse.json(
      { error: "hubUserId query parameter is required" },
      { status: 400 },
    );
  }

  const data = await fetchCrossSiteReputation(hubUserId);

  if (!data) {
    return NextResponse.json(
      { error: "Cross-site reputation unavailable" },
      { status: 503 },
    );
  }

  return NextResponse.json(data);
}
