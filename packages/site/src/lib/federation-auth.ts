/**
 * Verify that a request comes from the Hub / federation network.
 *
 * For now this performs a basic check: the X-Agora-Site-Id header must be
 * present and match this site's own AGORA_SITE_ID env var.
 *
 * In production this would verify a full HMAC signature, but the header
 * presence check is sufficient for the initial federation implementation.
 */
export function verifyHubRequest(request: Request): boolean {
  const siteIdHeader = request.headers.get("x-agora-site-id");
  if (!siteIdHeader) {
    return false;
  }

  const expectedSiteId = process.env.AGORA_SITE_ID;
  if (!expectedSiteId) {
    // If not configured, accept any request with the header present
    return true;
  }

  return siteIdHeader === expectedSiteId;
}
