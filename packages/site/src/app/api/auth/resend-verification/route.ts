import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";
import { verificationEmailTemplate } from "@/lib/email/templates";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase();

  const { allowed } = await rateLimit(`resend-verify:${normalizedEmail}`, 1, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Please wait before requesting another email" }, { status: 429 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user || user.emailVerified) {
    // Don't reveal whether user exists
    return NextResponse.json({ message: "If your account exists and is unverified, a new email has been sent." });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.insert(verificationTokens).values({
    identifier: normalizedEmail,
    token,
    expires,
  });

  const baseUrl = process.env.AUTH_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

  await sendEmail({
    to: normalizedEmail,
    subject: "Verify your email - Christians Debate",
    html: verificationEmailTemplate(verifyUrl, user.displayName),
  });

  return NextResponse.json({ message: "If your account exists and is unverified, a new email has been sent." });
}
