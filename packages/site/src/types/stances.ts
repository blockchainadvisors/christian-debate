export type StanceSide = "side_a" | "side_b" | "neutral";
export type AlgorithmicLean = "side_a" | "side_b" | "neutral" | "mixed";

export interface StanceWithUser {
  id: string;
  debateId: string;
  userId: string;
  declaredStance: StanceSide;
  algorithmicLean: AlgorithmicLean | null;
  leanConfidence: number | null;
  previousStance: StanceSide | null;
  declaredAt: string;
  changedAt: string | null;
  user: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
}

export interface StanceSummary {
  sideA: number;
  sideB: number;
  neutral: number;
}

export interface StanceShift {
  id: string;
  debateId: string;
  userId: string;
  fromStance: StanceSide;
  toStance: StanceSide;
  triggeredByCommentId: string | null;
  shiftedAt: string;
  note: string | null;
}

export interface StancesResponse {
  stances: StanceWithUser[];
  summary: StanceSummary;
}
