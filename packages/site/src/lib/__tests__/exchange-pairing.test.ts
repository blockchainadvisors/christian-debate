import { describe, it, expect } from "vitest";
import { findBestExchanges } from "@/lib/exchange-pairing";
import type { CommentWithAuthor } from "@/types/comments";

// ─── Mock Helpers ────────────────────────────────────────────────────

function mockComment(
  overrides: Partial<CommentWithAuthor> & {
    id: string;
    score: number;
    stanceSide: CommentWithAuthor["stanceSide"];
  }
): CommentWithAuthor {
  return {
    debateId: "debate-1",
    authorId: "author-1",
    parentId: null,
    rootId: null,
    depth: 0,
    content: "Mock comment content.",
    ancestorPath: null,
    isQuarantined: false,
    quarantineReason: null,
    status: "active",
    createdAt: new Date().toISOString(),
    editedAt: null,
    author: {
      id: overrides.authorId ?? "author-1",
      displayName: "Test User",
      username: "testuser",
      avatarUrl: null,
    },
    ...overrides,
  };
}

describe("findBestExchanges", () => {
  it("empty comments returns no exchanges", () => {
    const result = findBestExchanges([]);
    expect(result).toEqual([]);
  });

  it("comments without opposing replies returns no exchanges", () => {
    // Two top-level comments on the same side, no parent-child relationship
    const comments: CommentWithAuthor[] = [
      mockComment({ id: "c1", score: 20, stanceSide: "side_a", authorId: "a1" }),
      mockComment({ id: "c2", score: 20, stanceSide: "side_a", authorId: "a2" }),
    ];
    const result = findBestExchanges(comments);
    expect(result).toEqual([]);
  });

  it("opposing pair with high scores returns an exchange", () => {
    // A side_a comment with a side_b reply, both high-scoring
    const comments: CommentWithAuthor[] = [
      mockComment({ id: "c1", score: 10, stanceSide: "side_a", authorId: "a1" }),
      mockComment({
        id: "c2",
        score: 10,
        stanceSide: "side_b",
        parentId: "c1",
        rootId: "c1",
        depth: 1,
        authorId: "a2",
      }),
    ];
    const result = findBestExchanges(comments);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].comments).toHaveLength(2);
    expect(result[0].comments[0].id).toBe("c1");
    expect(result[0].comments[1].id).toBe("c2");
  });

  it("pair score formula is correct: min*2 + max", () => {
    // Two comments with known scores: min=8, max=12 => 8*2+12 = 28
    const comments: CommentWithAuthor[] = [
      mockComment({ id: "c1", score: 8, stanceSide: "side_a", authorId: "a1" }),
      mockComment({
        id: "c2",
        score: 12,
        stanceSide: "side_b",
        parentId: "c1",
        rootId: "c1",
        depth: 1,
        authorId: "a2",
      }),
    ];
    // The threshold is percentile(75) of [8, 12].
    // sorted = [8, 12], index = 0.75 * 1 = 0.75
    // value = 8 + (12-8)*0.75 = 8 + 3 = 11
    // threshold = max(11, 1) = 11
    // c1 score=8 < 11, so it won't pass the threshold filter.
    // We need scores above threshold. Let's use equal high scores instead.
    const comments2: CommentWithAuthor[] = [
      mockComment({ id: "c1", score: 20, stanceSide: "side_a", authorId: "a1" }),
      mockComment({
        id: "c2",
        score: 30,
        stanceSide: "side_b",
        parentId: "c1",
        rootId: "c1",
        depth: 1,
        authorId: "a2",
      }),
    ];
    // threshold = percentile(75, [20,30]) = 20 + (30-20)*0.75 = 27.5
    // Both need >= 27.5. c1=20 < 27.5, still fails.
    // To get both above threshold, we need more comments to lower the threshold.
    const withFiller: CommentWithAuthor[] = [
      mockComment({ id: "c1", score: 20, stanceSide: "side_a", authorId: "a1" }),
      mockComment({
        id: "c2",
        score: 30,
        stanceSide: "side_b",
        parentId: "c1",
        rootId: "c1",
        depth: 1,
        authorId: "a2",
      }),
      mockComment({ id: "c3", score: 1, stanceSide: "neutral", authorId: "a3" }),
      mockComment({ id: "c4", score: 2, stanceSide: "neutral", authorId: "a4" }),
      mockComment({ id: "c5", score: 3, stanceSide: "neutral", authorId: "a5" }),
    ];
    // scores = [1, 2, 3, 20, 30], sorted = [1, 2, 3, 20, 30]
    // p75 index = 0.75 * 4 = 3 => value = sorted[3] = 20
    // threshold = max(20, 1) = 20
    // c1=20 >= 20 OK, c2=30 >= 20 OK
    // pairScore = min(20,30)*2 + max(20,30) = 20*2 + 30 = 70
    const result = findBestExchanges(withFiller);
    expect(result.length).toBe(1);
    expect(result[0].pairScore).toBe(70);
  });

  it("results sorted by pair score descending", () => {
    // Create two exchange pairs with different scores
    const comments: CommentWithAuthor[] = [
      // Filler to keep threshold low
      mockComment({ id: "f1", score: 1, stanceSide: "neutral", authorId: "a9" }),
      mockComment({ id: "f2", score: 1, stanceSide: "neutral", authorId: "a8" }),
      mockComment({ id: "f3", score: 1, stanceSide: "neutral", authorId: "a7" }),
      // Pair 1: lower scoring exchange
      mockComment({ id: "c1", score: 10, stanceSide: "side_a", authorId: "a1" }),
      mockComment({
        id: "c2",
        score: 10,
        stanceSide: "side_b",
        parentId: "c1",
        rootId: "c1",
        depth: 1,
        authorId: "a2",
      }),
      // Pair 2: higher scoring exchange
      mockComment({ id: "c3", score: 20, stanceSide: "side_b", authorId: "a3" }),
      mockComment({
        id: "c4",
        score: 25,
        stanceSide: "side_a",
        parentId: "c3",
        rootId: "c3",
        depth: 1,
        authorId: "a4",
      }),
    ];
    // scores = [1, 1, 1, 10, 10, 20, 25]
    // sorted = [1, 1, 1, 10, 10, 20, 25]
    // p75 index = 0.75 * 6 = 4.5 => sorted[4] + (sorted[5]-sorted[4])*0.5 = 10 + 5 = 15
    // threshold = max(15, 1) = 15
    // Pair 1: c1=10 < 15 FAIL
    // Pair 2: c3=20 >= 15, c4=25 >= 15 OK
    // Only one pair passes. Let me adjust scores.
    const comments2: CommentWithAuthor[] = [
      mockComment({ id: "f1", score: 1, stanceSide: "neutral", authorId: "a9" }),
      mockComment({ id: "f2", score: 1, stanceSide: "neutral", authorId: "a8" }),
      mockComment({ id: "f3", score: 1, stanceSide: "neutral", authorId: "a7" }),
      mockComment({ id: "f4", score: 1, stanceSide: "neutral", authorId: "a6" }),
      mockComment({ id: "f5", score: 1, stanceSide: "neutral", authorId: "a5" }),
      // Pair 1: scores 15, 15 => pairScore = 15*2+15 = 45
      mockComment({ id: "c1", score: 15, stanceSide: "side_a", authorId: "a1" }),
      mockComment({
        id: "c2",
        score: 15,
        stanceSide: "side_b",
        parentId: "c1",
        rootId: "c1",
        depth: 1,
        authorId: "a2",
      }),
      // Pair 2: scores 20, 25 => pairScore = 20*2+25 = 65
      mockComment({ id: "c3", score: 20, stanceSide: "side_b", authorId: "a3" }),
      mockComment({
        id: "c4",
        score: 25,
        stanceSide: "side_a",
        parentId: "c3",
        rootId: "c3",
        depth: 1,
        authorId: "a4",
      }),
    ];
    // scores = [1,1,1,1,1,15,15,20,25] sorted
    // p75 index = 0.75 * 8 = 6 => sorted[6] = 15
    // threshold = max(15, 1) = 15
    // Pair 1: 15 >= 15, 15 >= 15 => pairScore = 15*2+15 = 45
    // Pair 2: 20 >= 15, 25 >= 15 => pairScore = 20*2+25 = 65
    const result = findBestExchanges(comments2);
    expect(result.length).toBe(2);
    expect(result[0].pairScore).toBeGreaterThan(result[1].pairScore);
    expect(result[0].pairScore).toBe(65);
    expect(result[1].pairScore).toBe(45);
  });

  it("low-scoring pairs are excluded by threshold", () => {
    // All comments are low scoring
    const comments: CommentWithAuthor[] = [
      mockComment({ id: "c1", score: 0, stanceSide: "side_a", authorId: "a1" }),
      mockComment({
        id: "c2",
        score: 0,
        stanceSide: "side_b",
        parentId: "c1",
        rootId: "c1",
        depth: 1,
        authorId: "a2",
      }),
    ];
    // scores = [0, 0], p75 = 0, threshold = max(0, 1) = 1
    // Both scores (0) < threshold (1) => no exchanges
    const result = findBestExchanges(comments);
    expect(result).toEqual([]);
  });

  it("chain extension includes a third comment replying to the reply", () => {
    const comments: CommentWithAuthor[] = [
      mockComment({ id: "f1", score: 1, stanceSide: "neutral", authorId: "a9" }),
      mockComment({ id: "f2", score: 1, stanceSide: "neutral", authorId: "a8" }),
      mockComment({ id: "f3", score: 1, stanceSide: "neutral", authorId: "a7" }),
      mockComment({ id: "f4", score: 1, stanceSide: "neutral", authorId: "a6" }),
      mockComment({ id: "f5", score: 1, stanceSide: "neutral", authorId: "a5" }),
      // A -> B -> C chain with opposing stances
      mockComment({ id: "c1", score: 20, stanceSide: "side_a", authorId: "a1" }),
      mockComment({
        id: "c2",
        score: 20,
        stanceSide: "side_b",
        parentId: "c1",
        rootId: "c1",
        depth: 1,
        authorId: "a2",
      }),
      mockComment({
        id: "c3",
        score: 20,
        stanceSide: "side_a",
        parentId: "c2",
        rootId: "c1",
        depth: 2,
        authorId: "a1",
      }),
    ];
    const result = findBestExchanges(comments);
    expect(result.length).toBeGreaterThanOrEqual(1);
    // The chain should include 3 comments
    expect(result[0].comments).toHaveLength(3);
    expect(result[0].comments[0].id).toBe("c1");
    expect(result[0].comments[1].id).toBe("c2");
    expect(result[0].comments[2].id).toBe("c3");
  });
});
