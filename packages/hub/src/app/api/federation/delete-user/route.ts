import { NextRequest, NextResponse } from "next/server";
import { verifySiteApiKey } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  // Verify site API key auth
  const siteAuth = await verifySiteApiKey(request);
  if (!siteAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  // Acknowledge the deletion request.
  // Actual site-side deletion is handled by the site's own
  // /api/privacy/delete-account or /api/federation/delete-user endpoint.
  console.log(
    `[FEDERATION] Delete-user webhook acknowledged for hubUserId=${hubUserId} ` +
      `from site=${siteAuth.siteId}`,
  );

  return NextResponse.json({ acknowledged: true });
}
