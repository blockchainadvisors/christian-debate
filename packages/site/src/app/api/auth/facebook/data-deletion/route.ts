import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Facebook Data Deletion Callback
 * https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
 *
 * When a user removes your app from their Facebook settings, Facebook sends
 * a signed request to this endpoint. We confirm receipt and provide a status URL.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const signedRequest = formData.get("signed_request") as string;

    if (!signedRequest) {
      return NextResponse.json({ error: "Missing signed_request" }, { status: 400 });
    }

    const data = parseSignedRequest(signedRequest);
    if (!data) {
      return NextResponse.json({ error: "Invalid signed_request" }, { status: 400 });
    }

    const facebookUserId = data.user_id;

    // Remove the Facebook account link
    await db
      .delete(accounts)
      .where(
        and(
          eq(accounts.provider, "facebook"),
          eq(accounts.providerAccountId, facebookUserId)
        )
      );

    // Generate a confirmation code
    const confirmationCode = crypto.randomUUID();
    const origin = req.headers.get("origin") || req.nextUrl.origin;
    const statusUrl = `${origin}/api/auth/facebook/data-deletion?code=${confirmationCode}`;

    return NextResponse.json({
      url: statusUrl,
      confirmation_code: confirmationCode,
    });
  } catch (error) {
    console.error("Facebook data deletion error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing confirmation code" }, { status: 400 });
  }

  return NextResponse.json({
    status: "complete",
    confirmation_code: code,
    message: "Your Facebook data has been deleted from Christians Debate.",
  });
}

function parseSignedRequest(signedRequest: string): { user_id: string } | null {
  const [encodedSig, payload] = signedRequest.split(".");
  if (!encodedSig || !payload) return null;

  const secret = process.env.AUTH_FACEBOOK_SECRET;
  if (!secret) return null;

  const sig = Buffer.from(encodedSig.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest();

  if (!crypto.timingSafeEqual(sig, expectedSig)) return null;

  const decoded = JSON.parse(
    Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
  );

  return decoded;
}
