import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { token, email, newPassword } = await req.json();

  if (!token || !email || !newPassword) {
    return NextResponse.json({ error: "Token, email, and new password are required" }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const [record] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.identifier, email.toLowerCase())
      )
    )
    .limit(1);

  if (!record || record.expires < new Date()) {
    if (record) {
      await db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.token, token));
    }
    return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
  }

  // Delete token (single-use)
  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token));

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.email, email.toLowerCase()));

  return NextResponse.json({ message: "Password reset successfully" });
}
