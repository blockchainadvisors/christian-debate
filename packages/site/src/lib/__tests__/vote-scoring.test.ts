import { describe, it, expect } from "vitest";
import { computeCommentScore } from "@/lib/vote-scoring";

describe("computeCommentScore", () => {
  it("returns 0 for empty votes", () => {
    expect(computeCommentScore([])).toBe(0);
  });

  it("single upvote with well_reasoned returns correct score", () => {
    const votes = [{ direction: "up", reason: "well_reasoned", weight: 1.0 }];
    // well_reasoned multiplier = 1, weight = 1.0 => 1 * 1.0 = 1
    expect(computeCommentScore(votes)).toBe(1);
  });

  it("changed_my_mind has 3x multiplier", () => {
    const votes = [{ direction: "up", reason: "changed_my_mind", weight: 1.0 }];
    // changed_my_mind multiplier = 3, weight = 1.0 => 3 * 1.0 = 3
    expect(computeCommentScore(votes)).toBe(3);
  });

  it("well_sourced has 2x multiplier", () => {
    const votes = [{ direction: "up", reason: "well_sourced", weight: 1.0 }];
    // well_sourced multiplier = 2, weight = 1.0 => 2 * 1.0 = 2
    expect(computeCommentScore(votes)).toBe(2);
  });

  it("downvotes subtract from score", () => {
    const votes = [{ direction: "down", reason: "off_topic", weight: 1.0 }];
    // off_topic multiplier = -1, weight = 1.0 => -1 * 1.0 = -1
    expect(computeCommentScore(votes)).toBe(-1);
  });

  it("mixed votes compute correctly", () => {
    const votes = [
      { direction: "up", reason: "well_reasoned", weight: 1.0 },   // 1 * 1.0 = 1
      { direction: "up", reason: "well_sourced", weight: 1.0 },    // 2 * 1.0 = 2
      { direction: "up", reason: "changed_my_mind", weight: 1.0 }, // 3 * 1.0 = 3
      { direction: "down", reason: "uncivil", weight: 1.0 },       // -1 * 1.0 = -1
      { direction: "down", reason: "low_effort", weight: 1.0 },    // -1 * 1.0 = -1
    ];
    // Total: 1 + 2 + 3 + (-1) + (-1) = 4
    expect(computeCommentScore(votes)).toBe(4);
  });

  it("vote weight is applied as a multiplier", () => {
    const votes = [
      { direction: "up", reason: "well_reasoned", weight: 2.0 },
    ];
    // well_reasoned multiplier = 1, weight = 2.0 => 1 * 2.0 = 2
    expect(computeCommentScore(votes)).toBe(2);
  });

  it("weight applies to all reason multipliers", () => {
    const votes = [
      { direction: "up", reason: "changed_my_mind", weight: 1.5 },
    ];
    // changed_my_mind multiplier = 3, weight = 1.5 => 3 * 1.5 = 4.5 => rounded to 5
    expect(computeCommentScore(votes)).toBe(5);
  });

  it("multiple weighted downvotes compute correctly", () => {
    const votes = [
      { direction: "down", reason: "misleading_unsourced", weight: 2.0 }, // -1 * 2.0 = -2
      { direction: "down", reason: "low_effort", weight: 1.5 },          // -1 * 1.5 = -1.5
    ];
    // Total: -2 + -1.5 = -3.5 => Math.round(-3.5) = -3 (rounds toward +infinity)
    expect(computeCommentScore(votes)).toBe(-3);
  });
});
