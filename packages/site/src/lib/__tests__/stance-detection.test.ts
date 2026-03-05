import { describe, it, expect } from "vitest";
import { computeAlgorithmicLean } from "../stance-detection";

describe("computeAlgorithmicLean", () => {
  it("returns neutral with 0 confidence when there is no activity", () => {
    const result = computeAlgorithmicLean({
      commentsByStance: { side_a: 0, side_b: 0, neutral: 0 },
      votesByStance: { side_a_up: 0, side_b_up: 0, side_a_down: 0, side_b_down: 0 },
    });
    expect(result.lean).toBe("neutral");
    expect(result.confidence).toBe(0);
  });

  it("returns neutral with 0 confidence when activity is below threshold", () => {
    // 1 neutral comment = 2 total activity, which is < 3
    const result = computeAlgorithmicLean({
      commentsByStance: { side_a: 0, side_b: 0, neutral: 1 },
      votesByStance: { side_a_up: 0, side_b_up: 0, side_a_down: 0, side_b_down: 0 },
    });
    expect(result.lean).toBe("neutral");
    expect(result.confidence).toBe(0);
  });

  it("returns mixed when activity is balanced between sides", () => {
    const result = computeAlgorithmicLean({
      commentsByStance: { side_a: 3, side_b: 3, neutral: 0 },
      votesByStance: { side_a_up: 2, side_b_up: 2, side_a_down: 1, side_b_down: 1 },
    });
    expect(result.lean).toBe("mixed");
    expect(result.confidence).toBe(0);
  });

  it("returns side_a with high confidence for heavily side_a activity", () => {
    const result = computeAlgorithmicLean({
      commentsByStance: { side_a: 10, side_b: 0, neutral: 0 },
      votesByStance: { side_a_up: 5, side_b_up: 0, side_a_down: 0, side_b_down: 0 },
    });
    expect(result.lean).toBe("side_a");
    expect(result.confidence).toBeGreaterThanOrEqual(0.5);
  });

  it("returns side_b with high confidence for heavily side_b activity", () => {
    const result = computeAlgorithmicLean({
      commentsByStance: { side_a: 0, side_b: 10, neutral: 0 },
      votesByStance: { side_a_up: 0, side_b_up: 5, side_a_down: 0, side_b_down: 0 },
    });
    expect(result.lean).toBe("side_b");
    expect(result.confidence).toBeGreaterThanOrEqual(0.5);
  });

  it("returns correct side with moderate confidence for moderate lean", () => {
    // side_a: 3*2 + 2*1 - 0*0.5 = 8
    // side_b: 1*2 + 1*1 - 0*0.5 = 3
    // neutral: 1*2 = 2
    // total = 13
    // lean = (8 - 3) / 13 = 0.3846...
    const result = computeAlgorithmicLean({
      commentsByStance: { side_a: 3, side_b: 1, neutral: 1 },
      votesByStance: { side_a_up: 2, side_b_up: 1, side_a_down: 0, side_b_down: 0 },
    });
    expect(result.lean).toBe("side_a");
    expect(result.confidence).toBeGreaterThanOrEqual(0.2);
    expect(result.confidence).toBeLessThan(0.5);
  });
});
