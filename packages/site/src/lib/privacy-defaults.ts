/**
 * Default privacy settings for all users.
 * All defaults are set to the most restrictive/private options.
 *
 * - profileVisibility: "private" — user profiles are not visible to other sites by default
 * - crossSiteRepDisplay: false — reputation scores are not shown across sites
 * - commentHighlightsSharing: false — comment highlights are not shared with the Hub
 * - fingerprintSharing: false — engagement fingerprints are not shared
 *
 * Comment content and votes NEVER leave the originating site.
 * The Hub only receives computed reputation snapshots, not raw data.
 */
export const PRIVACY_DEFAULTS = {
  /** User profile visibility across federated sites */
  profileVisibility: "private" as const,

  /** Whether to display cross-site reputation scores */
  crossSiteRepDisplay: false,

  /** Whether comment highlights can be shared with the Hub */
  commentHighlightsSharing: false,

  /** Whether engagement fingerprint data can be shared */
  fingerprintSharing: false,
} as const;

export type PrivacyDefaults = typeof PRIVACY_DEFAULTS;
