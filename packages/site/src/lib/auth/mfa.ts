import { TOTP, Secret } from "otpauth";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required for MFA encryption");
  return crypto.createHash("sha256").update(secret).digest();
}

export function generateMfaSecret(email: string) {
  const secret = new Secret();

  const totp = new TOTP({
    issuer: "Christians Debate",
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });

  return {
    secret: secret.base32,
    otpauthUri: totp.toString(),
  };
}

export function verifyMfaToken(base32Secret: string, token: string): boolean {
  const totp = new TOTP({
    secret: Secret.fromBase32(base32Secret),
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  });

  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}

export function encryptSecret(secret: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(secret, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decryptSecret(encrypted: string): string {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, data] = encrypted.split(":");

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  let decrypted = decipher.update(data, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function generateRecoveryCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    codes.push(crypto.randomBytes(4).toString("hex"));
  }
  return codes;
}

export function hashRecoveryCode(code: string): string {
  return bcrypt.hashSync(code.toLowerCase(), 10);
}

export function verifyRecoveryCode(code: string, hash: string): boolean {
  return bcrypt.compareSync(code.toLowerCase(), hash);
}
