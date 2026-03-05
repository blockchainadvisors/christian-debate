import { randomBytes, randomUUID } from "node:crypto";

/** Generate a random 64-character hex string suitable for use as an API key. */
export function generateApiKey(): string {
  return randomBytes(32).toString("hex");
}

/** Generate a random 64-character hex string suitable for use as a client secret. */
export function generateClientSecret(): string {
  return randomBytes(32).toString("hex");
}

/** Generate a UUID-like string suitable for use as a client ID. */
export function generateClientId(): string {
  return randomUUID();
}
