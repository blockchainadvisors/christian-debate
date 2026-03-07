import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";
import { passwordResetEmailTemplate } from "@/lib/email/templates";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase();

  const { allowed } = await rateLimit(`forgot-pw:${normalizedEmail}`, 3, 3600);
  if (!allowed) {
    return NextResponse.json({ message: "If an account exists, we sent a reset link." });
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.insert(passwordResetTokens).values({
      identifier: normalizedEmail,
      token,
      expires,
    });

    const baseUrl = process.env.AUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

    await sendEmail({
      to: normalizedEmail,
      subject: "Reset your password - Christians Debate",
      html: passwordResetEmailTemplate(resetUrl),
    });
  }

  // Always return 200 to not leak whether email exists
  return NextResponse.json({ message: "If an account exists, we sent a reset link." });
}
