import { createHmac } from "node:crypto";
import { redis } from "@/lib/redis";
import type { CrossSiteReputation } from "@/types/federation";

const HUB_URL = process.env.AGORA_HUB_URL;
const SITE_ID = process.env.AGORA_SITE_ID;
const API_KEY = process.env.AGORA_API_KEY;

const CACHE_TTL = 3600; // 1 hour

/**
 * Create HMAC signature headers for Hub API requests.
 */
function signRequest(body: string): Record<string, string> {
  if (!SITE_ID || !API_KEY) {
    throw new Error("AGORA_SITE_ID and AGORA_API_KEY must be configured");
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload = body + timestamp;
  const signature = createHmac("sha256", API_KEY)
    .update(payload)
    .digest("hex");

  return {
    "X-Agora-Site-Id": SITE_ID,
    "X-Agora-Timestamp": timestamp,
    "X-Agora-Signature": signature,
    "Content-Type": "application/json",
  };
}

/**
 * Fetch cross-site reputation for a hub user.
 * Results are cached in Redis for 1 hour.
 * Returns null if the Hub is unreachable or not configured.
 */
export async function fetchCrossSiteReputation(
  hubUserId: string,
): Promise<CrossSiteReputation | null> {
  if (!HUB_URL || !SITE_ID || !API_KEY) {
    return null;
  }

  const cacheKey = `hub:reputation:${hubUserId}`;

  try {
    // Check cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as CrossSiteReputation;
    }
  } catch {
    // Redis failure should not block the request
  }

  try {
    const body = "";
    const headers = signRequest(body);

    const response = await fetch(
      `${HUB_URL}/api/federation/user/${hubUserId}/cross-site-reputation`,
      {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!response.ok) {
      console.error(
        `Hub cross-site reputation request failed: ${response.status}`,
      );
      return null;
    }

    const data = (await response.json()) as CrossSiteReputation;

    // Cache the result
    try {
      await redis.set(cacheKey, JSON.stringify(data), "EX", CACHE_TTL);
    } catch {
      // Redis failure should not block the response
    }

    return data;
  } catch (error) {
    console.error("Failed to fetch cross-site reputation from Hub:", error);
    return null;
  }
}

/**
 * POST reputation snapshots to the Hub.
 * Used by the sync job.
 */
export async function syncReputationToHub(
  snapshots: Array<{
    hubUserId: string;
    reputationScore: number;
    persuasionRating: number;
    commentCount: number;
    debateCount: number;
  }>,
): Promise<{ synced: number } | null> {
  if (!HUB_URL || !SITE_ID || !API_KEY) {
    return null;
  }

  try {
    const body = JSON.stringify({ snapshots });
    const headers = signRequest(body);

    const response = await fetch(
      `${HUB_URL}/api/federation/sync-reputation`,
      {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!response.ok) {
      console.error(`Hub sync-reputation request failed: ${response.status}`);
      return null;
    }

    return (await response.json()) as { synced: number };
  } catch (error) {
    console.error("Failed to sync reputation to Hub:", error);
    return null;
  }
}
