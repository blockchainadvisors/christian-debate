import { db } from "@/db";
import { siteRegistrations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_TIMESTAMP_DRIFT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Verify a site API key request using HMAC-SHA256 signatures.
 *
 * Expected headers:
 *   X-Agora-Site-Id   — the site registration UUID
 *   X-Agora-Timestamp — Unix timestamp (seconds) when the request was signed
 *   X-Agora-Signature — HMAC-SHA256(body + timestamp, apiKey) hex digest
 *
 * Returns { siteId } if valid, null otherwise.
 */
export async function verifySiteApiKey(
  request: Request,
): Promise<{ siteId: string } | null> {
  const siteId = request.headers.get("x-agora-site-id");
  const signature = request.headers.get("x-agora-signature");
  const timestampHeader = request.headers.get("x-agora-timestamp");

  if (!siteId || !signature || !timestampHeader) {
    return null;
  }

  // Validate timestamp is within acceptable window
  const timestamp = parseInt(timestampHeader, 10);
  if (isNaN(timestamp)) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) * 1000 > MAX_TIMESTAMP_DRIFT_MS) {
    return null;
  }

  // Look up the site's API key
  const [site] = await db
    .select({ id: siteRegistrations.id, apiKey: siteRegistrations.apiKey })
    .from(siteRegistrations)
    .where(eq(siteRegistrations.id, siteId))
    .limit(1);

  if (!site) {
    return null;
  }

  // Clone the request to read the body without consuming it
  const body = await request.clone().text();

  // Compute expected signature: HMAC-SHA256(body + timestamp, apiKey)
  const payload = body + timestampHeader;
  const expectedSignature = createHmac("sha256", site.apiKey)
    .update(payload)
    .digest("hex");

  // Constant-time comparison
  const sigBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return null;
  }

  return { siteId: site.id };
}
