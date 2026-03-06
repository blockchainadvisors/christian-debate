import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

let cached: { jwt: string; expiresAt: number } | null = null;

/**
 * Generates an Apple Sign In client secret JWT on-the-fly.
 * Caches the result and regenerates when within 7 days of expiry.
 *
 * Required env vars:
 *   AUTH_APPLE_TEAM_ID, AUTH_APPLE_KEY_ID, AUTH_APPLE_ID,
 *   AUTH_APPLE_PRIVATE_KEY_PATH or AUTH_APPLE_PRIVATE_KEY
 */
export function generateAppleClientSecret(): string {
  const now = Math.floor(Date.now() / 1000);
  const sevenDays = 7 * 24 * 60 * 60;

  if (cached && cached.expiresAt - now > sevenDays) {
    return cached.jwt;
  }

  const teamId = process.env.AUTH_APPLE_TEAM_ID!;
  const keyId = process.env.AUTH_APPLE_KEY_ID!;
  const clientId = process.env.AUTH_APPLE_ID!;

  const privateKey = getPrivateKey();
  const exp = now + 180 * 24 * 60 * 60; // 6 months

  const header = { alg: "ES256", kid: keyId };
  const payload = {
    iss: teamId,
    iat: now,
    exp,
    aud: "https://appleid.apple.com",
    sub: clientId,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const sign = crypto.createSign("SHA256");
  sign.update(signingInput);
  const signature = sign.sign({ key: privateKey, dsaEncoding: "ieee-p1363" });

  const jwt = `${signingInput}.${base64url(signature)}`;
  cached = { jwt, expiresAt: exp };

  return jwt;
}

function getPrivateKey(): string {
  // Allow inline key via env (useful for Docker/serverless)
  if (process.env.AUTH_APPLE_PRIVATE_KEY) {
    return process.env.AUTH_APPLE_PRIVATE_KEY.replace(/\\n/g, "\n");
  }

  let keyPath = process.env.AUTH_APPLE_PRIVATE_KEY_PATH!;
  if (keyPath.startsWith("~")) {
    keyPath = path.join(process.env.HOME || "", keyPath.slice(1));
  }
  if (!path.isAbsolute(keyPath)) {
    keyPath = path.resolve(process.cwd(), keyPath);
  }

  return fs.readFileSync(keyPath, "utf8");
}

function base64url(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64url");
}
