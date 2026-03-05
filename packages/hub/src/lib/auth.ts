import { NextRequest, NextResponse } from "next/server";

/**
 * Simple admin authentication for the Hub admin panel.
 * Checks the Authorization header against env credentials.
 *
 * Supports two auth schemes:
 * - Basic auth: `Authorization: Basic base64(email:password)`
 * - Bearer token: `Authorization: Bearer <HUB_ADMIN_PASSWORD>`
 *
 * Returns null if authorised, or an error NextResponse if not.
 */
export function checkHubAdmin(request: NextRequest): NextResponse | null {
  const expectedEmail = process.env.HUB_ADMIN_EMAIL;
  const expectedPassword = process.env.HUB_ADMIN_PASSWORD;

  if (!expectedEmail || !expectedPassword) {
    return NextResponse.json(
      { error: "Hub admin credentials not configured" },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Bearer token check
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length);
    if (token === expectedPassword) {
      return null; // authorised
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Basic auth check
  if (authHeader.startsWith("Basic ")) {
    try {
      const base64 = authHeader.slice("Basic ".length);
      const decoded = atob(base64);
      const [email, password] = decoded.split(":");
      if (email === expectedEmail && password === expectedPassword) {
        return null; // authorised
      }
    } catch {
      // fall through to unauthorized
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
