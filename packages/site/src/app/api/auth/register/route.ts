import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateUniqueUsername } from "@/lib/auth/utils";
import { sendEmail } from "@/lib/email";
import { verificationEmailTemplate } from "@/lib/email/templates";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const { allowed } = await rateLimit(`register:${ip}`, 5, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Too many registration attempts" }, { status: 429 });
  }

  const body = await req.json();
  const { email, password, displayName } = body;

  if (!email || !password || !displayName) {
    return NextResponse.json({ error: "Email, password, and display name are required" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const username = await generateUniqueUsername(displayName);

  await db.insert(users).values({
    email: email.toLowerCase(),
    displayName,
    username,
    passwordHash,
    emailVerified: null,
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db.insert(verificationTokens).values({
    identifier: email.toLowerCase(),
    token,
    expires,
  });

  const baseUrl = process.env.AUTH_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email.toLowerCase())}`;

  await sendEmail({
    to: email,
    subject: "Verify your email - Christians Debate",
    html: verificationEmailTemplate(verifyUrl, displayName),
  });

  return NextResponse.json({ message: "Account created. Check your email for verification." }, { status: 201 });
}
