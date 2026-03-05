export interface SiteReputationEntry {
  siteName: string;
  reputationScore: number;
  persuasionRating: number;
  commentCount: number;
  debateCount: number;
  snapshotAt: string;
}

export interface CrossSiteReputation {
  globalReputationScore: number;
  siteBreakdown: SiteReputationEntry[];
  totalMindsChanged: number;
}
