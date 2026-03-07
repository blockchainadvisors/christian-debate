import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { mfaSecrets, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  verifyMfaToken,
  decryptSecret,
  generateRecoveryCodes,
  hashRecoveryCode,
} from "@/lib/auth/mfa";
import { sendEmail } from "@/lib/email";
import { mfaEnabledEmailTemplate } from "@/lib/email/templates";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await req.json();
  if (!code) {
    return NextResponse.json({ error: "Verification code is required" }, { status: 400 });
  }

  const [mfa] = await db
    .select()
    .from(mfaSecrets)
    .where(
      and(
        eq(mfaSecrets.userId, session.user.id),
        eq(mfaSecrets.verified, false)
      )
    )
    .limit(1);

  if (!mfa) {
    return NextResponse.json({ error: "No pending MFA setup found" }, { status: 400 });
  }

  const secret = decryptSecret(mfa.encryptedSecret);
  const isValid = verifyMfaToken(secret, code);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
  }

  // Generate recovery codes
  const plainCodes = generateRecoveryCodes();
  const hashedCodes = plainCodes.map(hashRecoveryCode);

  await db
    .update(mfaSecrets)
    .set({
      verified: true,
      recoveryCodes: JSON.stringify(hashedCodes),
    })
    .where(eq(mfaSecrets.id, mfa.id));

  // Send confirmation email
  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (user) {
    await sendEmail({
      to: user.email,
      subject: "Two-factor authentication enabled - Christians Debate",
      html: mfaEnabledEmailTemplate(),
    }).catch(() => {}); // Non-critical, don't fail the request
  }

  return NextResponse.json({ recoveryCodes: plainCodes });
}
