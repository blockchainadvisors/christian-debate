import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { mfaSecrets } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  generateMfaSecret,
  encryptSecret,
  verifyMfaToken,
  decryptSecret,
  verifyRecoveryCode,
} from "@/lib/auth/mfa";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete any existing unverified secret
  await db
    .delete(mfaSecrets)
    .where(
      and(eq(mfaSecrets.userId, session.user.id), eq(mfaSecrets.verified, false))
    );

  const { secret, otpauthUri } = generateMfaSecret(session.user.email!);

  await db.insert(mfaSecrets).values({
    userId: session.user.id,
    encryptedSecret: encryptSecret(secret),
    verified: false,
  });

  return NextResponse.json({ secret, otpauthUri });
}

export async function DELETE(req: NextRequest) {
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
      and(eq(mfaSecrets.userId, session.user.id), eq(mfaSecrets.verified, true))
    )
    .limit(1);

  if (!mfa) {
    return NextResponse.json({ error: "MFA is not enabled" }, { status: 400 });
  }

  const secret = decryptSecret(mfa.encryptedSecret);
  let valid = verifyMfaToken(secret, code);

  if (!valid && mfa.recoveryCodes) {
    const codes: string[] = JSON.parse(mfa.recoveryCodes);
    valid = codes.some((c) => verifyRecoveryCode(code, c));
  }

  if (!valid) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  await db.delete(mfaSecrets).where(eq(mfaSecrets.userId, session.user.id));

  return NextResponse.json({ message: "MFA disabled" });
}
