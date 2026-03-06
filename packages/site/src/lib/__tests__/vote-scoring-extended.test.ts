import { describe, it, expect } from "vitest";
import {
  computeCommentScore,
  UPVOTE_REASONS,
  DOWNVOTE_REASONS,
  TRUST_TIER_WEIGHTS,
} from "@/lib/vote-scoring";

describe("computeCommentScore — edge cases", () => {
  it("unknown reason defaults to multiplier 1 for upvotes", () => {
    const votes = [{ direction: "up", reason: "unknown_reason", weight: 1.0 }];
    // Unknown reason falls through to ?? 1, so 1 * 1.0 = 1
    expect(computeCommentScore(votes)).toBe(1);
  });

  it("unknown reason defaults to -1 for downvotes", () => {
    const votes = [
      { direction: "down", reason: "fake_reason", weight: 1.0 },
    ];
    // Unknown reason with down direction => -1 * 1.0 = -1
    expect(computeCommentScore(votes)).toBe(-1);
  });

  it("zero-weight vote contributes nothing", () => {
    const votes = [
      { direction: "up", reason: "well_sourced", weight: 0 },
    ];
    expect(computeCommentScore(votes)).toBe(0);
  });

  it("negative weight inverts the vote effect", () => {
    // Should negative weights be allowed? Currently nothing prevents them
    const votes = [
      { direction: "up", reason: "well_reasoned", weight: -1.0 },
    ];
    // 1 * -1.0 = -1 — an upvote that subtracts from score
    expect(computeCommentScore(votes)).toBe(-1);
  });

  it("very large number of votes computes correctly", () => {
    const votes = Array.from({ length: 1000 }, () => ({
      direction: "up",
      reason: "well_reasoned",
      weight: 1.0,
    }));
    expect(computeCommentScore(votes)).toBe(1000);
  });

  it("score rounds 0.5 to 1 (Math.round banker's rounding check)", () => {
    // Math.round(0.5) = 1 in JS
    const votes = [
      { direction: "up", reason: "well_reasoned", weight: 0.5 },
    ];
    expect(computeCommentScore(votes)).toBe(1);
  });

  it("low-weight downvote still contributes at least -1", () => {
    const votes = [
      { direction: "down", reason: "off_topic", weight: 0.5 },
    ];
    // -1 * 0.5 = -0.5, but minimum contribution is -1
    expect(computeCommentScore(votes)).toBe(-1);
  });
});

describe("computeCommentScore — reason takes precedence over direction", () => {
  it("known reason multiplier is used regardless of direction", () => {
    // well_sourced has a known multiplier of +2, even if direction is "down"
    // This is fine because the API validates reason matches direction
    const votes = [
      { direction: "down", reason: "well_sourced", weight: 1.0 },
    ];
    expect(computeCommentScore(votes)).toBe(2);
  });

  it("known downvote reason is negative regardless of direction", () => {
    const votes = [
      { direction: "up", reason: "off_topic", weight: 1.0 },
    ];
    // off_topic has known multiplier -1, used even with "up" direction
    expect(computeCommentScore(votes)).toBe(-1);
  });

  it("direction is used as fallback for unknown reasons", () => {
    const upUnknown = [{ direction: "up", reason: "mystery", weight: 1.0 }];
    const downUnknown = [{ direction: "down", reason: "mystery", weight: 1.0 }];
    expect(computeCommentScore(upUnknown)).toBe(1);
    expect(computeCommentScore(downUnknown)).toBe(-1);
  });
});

describe("UPVOTE_REASONS and DOWNVOTE_REASONS", () => {
  it("every upvote reason has a positive multiplier", () => {
    for (const reason of UPVOTE_REASONS) {
      const score = computeCommentScore([
        { direction: "up", reason, weight: 1.0 },
      ]);
      expect(score).toBeGreaterThan(0);
    }
  });

  it("every downvote reason has a negative multiplier", () => {
    for (const reason of DOWNVOTE_REASONS) {
      const score = computeCommentScore([
        { direction: "down", reason, weight: 1.0 },
      ]);
      expect(score).toBeLessThan(0);
    }
  });

  it("no overlap between upvote and downvote reasons", () => {
    const overlap = UPVOTE_REASONS.filter((r) =>
      DOWNVOTE_REASONS.includes(r as any)
    );
    expect(overlap).toEqual([]);
  });

  it("all 5 upvote reasons are defined", () => {
    expect(UPVOTE_REASONS).toHaveLength(5);
  });

  it("all 5 downvote reasons are defined", () => {
    expect(DOWNVOTE_REASONS).toHaveLength(5);
  });
});

describe("TRUST_TIER_WEIGHTS", () => {
  it("all expected tiers are defined", () => {
    expect(TRUST_TIER_WEIGHTS).toHaveProperty("new");
    expect(TRUST_TIER_WEIGHTS).toHaveProperty("established");
    expect(TRUST_TIER_WEIGHTS).toHaveProperty("trusted");
    expect(TRUST_TIER_WEIGHTS).toHaveProperty("moderator");
    expect(TRUST_TIER_WEIGHTS).toHaveProperty("admin");
  });

  it("tiers are ordered by increasing weight", () => {
    expect(TRUST_TIER_WEIGHTS["new"]).toBeLessThan(
      TRUST_TIER_WEIGHTS["established"]
    );
    expect(TRUST_TIER_WEIGHTS["established"]).toBeLessThan(
      TRUST_TIER_WEIGHTS["trusted"]
    );
    expect(TRUST_TIER_WEIGHTS["trusted"]).toBeLessThan(
      TRUST_TIER_WEIGHTS["moderator"]
    );
  });

  it("moderator and admin have equal weight", () => {
    expect(TRUST_TIER_WEIGHTS["moderator"]).toBe(
      TRUST_TIER_WEIGHTS["admin"]
    );
  });

  it("new users have reduced vote weight (0.5)", () => {
    expect(TRUST_TIER_WEIGHTS["new"]).toBe(0.5);
  });

  it("all weights are positive", () => {
    for (const weight of Object.values(TRUST_TIER_WEIGHTS)) {
      expect(weight).toBeGreaterThan(0);
    }
  });

  it("weight affects score proportionally", () => {
    const newUserVote = computeCommentScore([
      { direction: "up", reason: "well_reasoned", weight: TRUST_TIER_WEIGHTS["new"] },
    ]);
    const trustedUserVote = computeCommentScore([
      { direction: "up", reason: "well_reasoned", weight: TRUST_TIER_WEIGHTS["trusted"] },
    ]);
    expect(trustedUserVote).toBeGreaterThan(newUserVote);
  });
});

describe("computeCommentScore — realistic scenarios", () => {
  it("high-quality comment with diverse upvotes", () => {
    const votes = [
      { direction: "up", reason: "well_reasoned", weight: 1.0 },
      { direction: "up", reason: "well_sourced", weight: 1.5 },
      { direction: "up", reason: "changed_my_mind", weight: 1.0 },
      { direction: "up", reason: "strong_counterpoint", weight: 2.0 },
      { direction: "up", reason: "well_written", weight: 0.5 },
    ];
    // 1*1.0 + 2*1.5 + 3*1.0 + 1*2.0 + 1*0.5 = 1 + 3 + 3 + 2 + 0.5 = 9.5 => 10
    expect(computeCommentScore(votes)).toBe(10);
  });

  it("controversial comment with mixed votes", () => {
    const votes = [
      { direction: "up", reason: "well_reasoned", weight: 1.0 },
      { direction: "up", reason: "well_reasoned", weight: 1.0 },
      { direction: "up", reason: "strong_counterpoint", weight: 1.5 },
      { direction: "down", reason: "misleading_unsourced", weight: 1.0 },
      { direction: "down", reason: "misrepresented_stance", weight: 2.0 },
      { direction: "down", reason: "uncivil", weight: 1.0 },
    ];
    // Up: 1 + 1 + 1.5 = 3.5
    // Down: -1 + -2 + -1 = -4
    // Total: 3.5 + (-4) = -0.5 => Math.round(-0.5) = 0
    expect(computeCommentScore(votes)).toBe(0);
  });

  it("troll comment with all downvotes from trusted users", () => {
    const votes = Array.from({ length: 5 }, () => ({
      direction: "down",
      reason: "uncivil",
      weight: TRUST_TIER_WEIGHTS["moderator"],
    }));
    // 5 * (-1 * 2.0) = -10
    expect(computeCommentScore(votes)).toBe(-10);
  });
});
