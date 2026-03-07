import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq, and } from "drizzle-orm";

function redirectUrl(path: string) {
  const base = process.env.AUTH_URL || "http://localhost:3000";
  return new URL(path, base);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return NextResponse.redirect(redirectUrl("/login?error=InvalidToken"));
  }

  const [record] = await db
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.token, token),
        eq(verificationTokens.identifier, email)
      )
    )
    .limit(1);

  if (!record || record.expires < new Date()) {
    // Clean up expired token if it exists
    if (record) {
      await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.token, token));
    }
    return NextResponse.redirect(redirectUrl("/login?error=InvalidToken"));
  }

  // Delete the token (single-use)
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.token, token));

  // Mark user as verified
  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.email, email));

  return NextResponse.redirect(redirectUrl("/login?verified=true"));
}
