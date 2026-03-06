#!/usr/bin/env tsx
/**
 * Generates Apple Sign In client secret (JWT).
 * Run: tsx packages/site/scripts/generate-apple-secret.ts
 *
 * Required env vars (or set in .env):
 *   AUTH_APPLE_TEAM_ID
 *   AUTH_APPLE_KEY_ID
 *   AUTH_APPLE_ID (Services ID)
 *   AUTH_APPLE_PRIVATE_KEY_PATH (path to .p8 file)
 */

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const EXPIRY_DAYS = 180; // Apple max is 6 months

function generateAppleClientSecret() {
  const teamId = process.env.AUTH_APPLE_TEAM_ID;
  const keyId = process.env.AUTH_APPLE_KEY_ID;
  const clientId = process.env.AUTH_APPLE_ID;
  let keyPath = process.env.AUTH_APPLE_PRIVATE_KEY_PATH;

  if (!teamId || !keyId || !clientId || !keyPath) {
    console.error("Missing required env vars:");
    if (!teamId) console.error("  AUTH_APPLE_TEAM_ID");
    if (!keyId) console.error("  AUTH_APPLE_KEY_ID");
    if (!clientId) console.error("  AUTH_APPLE_ID");
    if (!keyPath) console.error("  AUTH_APPLE_PRIVATE_KEY_PATH");
    process.exit(1);
  }

  // Expand ~ to home directory
  if (keyPath.startsWith("~")) {
    keyPath = path.join(process.env.HOME || "", keyPath.slice(1));
  }

  const privateKey = fs.readFileSync(keyPath, "utf8");

  const now = Math.floor(Date.now() / 1000);
  const exp = now + EXPIRY_DAYS * 24 * 60 * 60;

  // JWT header
  const header = {
    alg: "ES256",
    kid: keyId,
  };

  // JWT payload
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
  const signature = sign.sign(
    { key: privateKey, dsaEncoding: "ieee-p1363" },
  );

  const encodedSignature = base64url(signature);
  const jwt = `${signingInput}.${encodedSignature}`;

  const expiryDate = new Date(exp * 1000).toISOString().split("T")[0];

  console.log("\n--- Apple Client Secret (JWT) ---\n");
  console.log(jwt);
  console.log(`\n--- Expires: ${expiryDate} ---`);
  console.log("\nAdd this to your .env:");
  console.log(`AUTH_APPLE_SECRET=${jwt}\n`);
}

function base64url(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input) : input;
  return buf.toString("base64url");
}

generateAppleClientSecret();
