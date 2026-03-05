export type EngagementDepth = "shallow" | "moderate" | "deep";

export interface EngagementFingerprint {
  debatesEngaged: number;
  avgStance: number; // -1 (always side_a) to +1 (always side_b), 0 = balanced
  stanceConsistency: number; // 0-1, how often they stick with initial stance
  mindChangeRate: number; // stance shifts / debates engaged
  argumentStyleWeights: {
    empirical: number;
    moral_ethical: number;
    economic: number;
    procedural: number;
    anecdotal: number;
    legal: number;
    historical: number;
  }; // proportions summing to ~1
  engagementDepth: EngagementDepth; // based on avg comment depth
  persuasionScore: number; // total changed_my_mind upvotes received
  upvoteReasonProfile: {
    well_reasoned: number;
    well_sourced: number;
    changed_my_mind: number;
    strong_counterpoint: number;
    well_written: number;
  }; // proportions of upvote types received
  computedAt: string; // ISO date
}
