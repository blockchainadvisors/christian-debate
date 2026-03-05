import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";

/**
 * GET /api/federation/proxy/[...path]
 *
 * Proxies requests from client components to the Hub's federation API.
 * Signs requests with HMAC so Hub credentials are never exposed to the browser.
 *
 * Example: /api/federation/proxy/sites -> Hub's /api/federation/sites
 *          /api/federation/proxy/leaderboard -> Hub's /api/federation/leaderboard
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const hubUrl = process.env.AGORA_HUB_URL;
  if (!hubUrl) {
    return NextResponse.json(
      { error: "Agora Network is not configured" },
      { status: 503 },
    );
  }

  const { path } = await params;
  const subPath = path.join("/");

  // Only allow specific federation endpoints to be proxied
  const allowedPrefixes = ["sites", "search", "leaderboard", "network-stats"];
  const firstSegment = path[0];
  if (!allowedPrefixes.includes(firstSegment)) {
    return NextResponse.json(
      { error: "Endpoint not allowed" },
      { status: 403 },
    );
  }

  // Forward query parameters
  const searchParams = request.nextUrl.searchParams.toString();
  const targetUrl = `${hubUrl}/api/federation/${subPath}${searchParams ? `?${searchParams}` : ""}`;

  const siteId = process.env.AGORA_SITE_ID;
  const apiKey = process.env.AGORA_API_KEY;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add HMAC signing if credentials are available
  if (siteId && apiKey) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const body = ""; // GET requests have no body
    const signature = createHmac("sha256", apiKey)
      .update(body + timestamp)
      .digest("hex");

    headers["X-Agora-Site-Id"] = siteId;
    headers["X-Agora-Timestamp"] = timestamp;
    headers["X-Agora-Signature"] = signature;
  }

  try {
    const hubRes = await fetch(targetUrl, {
      method: "GET",
      headers,
      // Short timeout for federation calls
      signal: AbortSignal.timeout(10_000),
    });

    if (!hubRes.ok) {
      const errorText = await hubRes.text();
      console.error(`Hub proxy error [${hubRes.status}]:`, errorText);
      return NextResponse.json(
        { error: "Hub request failed" },
        { status: hubRes.status },
      );
    }

    const data = await hubRes.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Hub proxy fetch failed:", error);
    return NextResponse.json(
      { error: "Failed to contact Agora Hub" },
      { status: 502 },
    );
  }
}
