import { db } from "../index";
import {
  users,
  debates,
  debateStances,
  comments,
  votes,
  stanceShifts,
  verdictVotes,
  argumentTags,
  burdenOfProofRequests,
  accounts,
  sessions,
  verificationTokens,
  federatedIdentity,
} from "../schema";
import { hash } from "bcryptjs";
import { USER_SEEDS, type UserSeed } from "./users";
import { DEBATE_SEEDS, type DebateSeed } from "./debates";
import { COMMENT_POOLS, type CommentContent } from "./comments";
import { eq } from "drizzle-orm";

// ─── Constants ─────────────────────────────────────────────────────

const YEAR_START = new Date("2025-03-15");
const YEAR_END = new Date("2026-03-05");

// ─── Type helpers ──────────────────────────────────────────────────

type InsertedUser = typeof users.$inferSelect;
type InsertedDebate = typeof debates.$inferSelect;
type InsertedStance = typeof debateStances.$inferSelect;
type InsertedComment = typeof comments.$inferSelect;

const upReasons = [
  "well_reasoned",
  "well_sourced",
  "changed_my_mind",
  "strong_counterpoint",
  "well_written",
] as const;
const downReasons = [
  "off_topic",
  "uncivil",
  "misleading_unsourced",
  "misrepresented_stance",
  "low_effort",
] as const;
type VoteReason = (typeof upReasons)[number] | (typeof downReasons)[number];

// ─── Helpers ───────────────────────────────────────────────────────

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomDateBetween(start: Date, end: Date): Date {
  const s = start.getTime();
  const e = end.getTime();
  return new Date(s + Math.random() * (e - s));
}

function weightedRandom<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return items[i]!;
  }
  return items[items.length - 1]!;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function trustWeight(tier: string): number {
  switch (tier) {
    case "new":
      return 0.5;
    case "established":
      return 1.0;
    case "trusted":
      return 1.5;
    case "moderator":
      return 2.0;
    case "admin":
      return 2.0;
    default:
      return 1.0;
  }
}

// ─── Main Seed ─────────────────────────────────────────────────────

async function seed() {
  console.log("=== Seed Orchestrator Starting ===\n");

  // ── 1. Clear all tables in FK-safe order ─────────────────────────
  console.log("1. Clearing existing data...");
  await db.delete(burdenOfProofRequests);
  await db.delete(argumentTags);
  await db.delete(verdictVotes);
  await db.delete(stanceShifts);
  await db.delete(votes);
  await db.delete(comments);
  await db.delete(debateStances);
  await db.delete(debates);
  await db.delete(federatedIdentity);
  await db.delete(sessions);
  await db.delete(accounts);
  await db.delete(verificationTokens);
  await db.delete(users);
  console.log("   All tables cleared.\n");

  // ── 2. Insert users ──────────────────────────────────────────────
  console.log("2. Inserting users...");
  const passwordHash = await hash("password123", 10);

  const insertedUsers: InsertedUser[] = await db
    .insert(users)
    .values(
      USER_SEEDS.map((u: UserSeed) => ({
        username: u.username,
        displayName: u.displayName,
        email: u.email,
        passwordHash,
        trustTier: u.trustTier,
        reputationScore: u.reputationScore,
        persuasionRating: u.persuasionRating,
        createdAt: u.createdAt,
      }))
    )
    .returning();

  console.log(`   Inserted ${insertedUsers.length} users.\n`);

  // ── 3. Insert debates ────────────────────────────────────────────
  console.log("3. Inserting debates...");

  const insertedDebates: InsertedDebate[] = [];
  for (const d of DEBATE_SEEDS) {
    const [row] = await db
      .insert(debates)
      .values({
        title: d.title,
        slug: d.slug,
        description: d.description,
        sideALabel: d.sideALabel,
        sideBLabel: d.sideBLabel,
        status: d.status,
        tags: d.tags,
        createdAt: d.createdAt,
        createdBy: insertedUsers[d.creatorIndex]!.id,
      })
      .returning();
    insertedDebates.push(row!);
  }

  console.log(`   Inserted ${insertedDebates.length} debates.\n`);

  // ── 4. Insert stances ────────────────────────────────────────────
  console.log("4. Inserting debate stances...");

  const stanceSides = ["side_a", "side_b", "neutral"] as const;
  const stanceValues: {
    debateId: string;
    userId: string;
    declaredStance: (typeof stanceSides)[number];
    declaredAt: Date;
  }[] = [];

  // Track which debates each user participates in
  const userDebateMap = new Map<string, Set<string>>();

  for (let userIdx = 0; userIdx < insertedUsers.length; userIdx++) {
    const user = insertedUsers[userIdx]!;
    // Earlier users participate in more debates (5-9 range)
    const debateCount = Math.min(
      insertedDebates.length,
      randomInt(5, Math.min(9, 5 + Math.floor((insertedUsers.length - userIdx) / 3)))
    );

    // Pick debates deterministically but with some spread
    const participatingDebates: number[] = [];
    for (let i = 0; i < insertedDebates.length && participatingDebates.length < debateCount; i++) {
      const debateIdx = (userIdx * 3 + i * 7) % insertedDebates.length;
      if (!participatingDebates.includes(debateIdx)) {
        participatingDebates.push(debateIdx);
      }
    }
    // Fill remainder if needed
    for (let i = 0; participatingDebates.length < debateCount && i < insertedDebates.length; i++) {
      if (!participatingDebates.includes(i)) {
        participatingDebates.push(i);
      }
    }

    for (const debateIdx of participatingDebates) {
      const debate = insertedDebates[debateIdx]!;
      const stanceIdx = (userIdx * 7 + debateIdx * 3) % 3;
      const stance = stanceSides[stanceIdx]!;
      const declaredAt = randomDateBetween(
        debate.createdAt,
        new Date(debate.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000)
      );

      stanceValues.push({
        debateId: debate.id,
        userId: user.id,
        declaredStance: stance,
        declaredAt,
      });

      if (!userDebateMap.has(user.id)) {
        userDebateMap.set(user.id, new Set());
      }
      userDebateMap.get(user.id)!.add(debate.id);
    }
  }

  // Insert in batches of 50
  const insertedStances: InsertedStance[] = [];
  for (let i = 0; i < stanceValues.length; i += 50) {
    const batch = stanceValues.slice(i, i + 50);
    const result = await db.insert(debateStances).values(batch).returning();
    insertedStances.push(...result);
  }

  console.log(`   Inserted ${insertedStances.length} stances.\n`);

  // Build lookup: debateId -> list of stances (with user info)
  const debateStanceMap = new Map<
    string,
    { userId: string; stance: string; userIdx: number }[]
  >();
  for (const s of insertedStances) {
    const userIdx = insertedUsers.findIndex((u) => u.id === s.userId);
    if (!debateStanceMap.has(s.debateId)) {
      debateStanceMap.set(s.debateId, []);
    }
    debateStanceMap.get(s.debateId)!.push({
      userId: s.userId,
      stance: s.declaredStance,
      userIdx,
    });
  }

  // ── 5. Insert comments ───────────────────────────────────────────
  console.log("5. Inserting comments...");

  const allInsertedComments: InsertedComment[] = [];

  for (let debateIdx = 0; debateIdx < insertedDebates.length; debateIdx++) {
    const debate = insertedDebates[debateIdx]!;
    const pool: CommentContent[] = COMMENT_POOLS[debateIdx] ?? [];
    if (pool.length === 0) continue;

    const debateParticipants = debateStanceMap.get(debate.id) ?? [];
    if (debateParticipants.length === 0) continue;

    const debateComments: InsertedComment[] = [];
    const debateTimeSpan = YEAR_END.getTime() - debate.createdAt.getTime();

    for (let cIdx = 0; cIdx < pool.length; cIdx++) {
      const commentData = pool[cIdx]!;

      // Pick an author matching stanceSide if possible
      const matchingAuthors = debateParticipants.filter(
        (p) => p.stance === commentData.stanceSide
      );
      const author =
        matchingAuthors.length > 0
          ? randomItem(matchingAuthors)
          : randomItem(debateParticipants);

      // Determine thread structure
      let parentId: string | null = null;
      let rootId: string | null = null;
      let depth = 0;
      let ancestorPath: string[] | null = null;
      const positionRatio = cIdx / pool.length;

      if (positionRatio < 0.4) {
        // Top-level comment (depth 0)
        depth = 0;
      } else if (positionRatio < 0.75) {
        // Reply to random existing comment (depth = parent.depth + 1)
        if (debateComments.length > 0) {
          const parent = randomItem(debateComments);
          parentId = parent.id;
          rootId = parent.rootId ?? parent.id;
          depth = parent.depth + 1;
          ancestorPath = [...(parent.ancestorPath ?? []), parent.id];
        }
      } else {
        // Deeper replies (depth 3-5)
        if (debateComments.length > 0) {
          const parent = randomItem(debateComments);
          parentId = parent.id;
          rootId = parent.rootId ?? parent.id;
          depth = Math.max(parent.depth + 1, randomInt(3, 5));
          ancestorPath = [...(parent.ancestorPath ?? []), parent.id];
        }
      }

      // Spread createdAt across the period
      const createdAt = new Date(
        debate.createdAt.getTime() + (debateTimeSpan * (cIdx + 1)) / (pool.length + 1)
      );

      // Determine special statuses
      const isQuarantined = cIdx >= pool.length - 8 && cIdx < pool.length - 3;
      const isEdited = cIdx >= pool.length - 11 && cIdx < pool.length - 8;
      const isDeleted = cIdx >= pool.length - 3;

      let status: "active" | "edited" | "deleted_by_author" | "removed_by_mod" = "active";
      let editedAt: Date | undefined;
      let quarantineReason: string | undefined;

      if (isQuarantined) {
        quarantineReason = "Auto-quarantined: flagged by community";
      }
      if (isEdited) {
        status = "edited";
        editedAt = new Date(createdAt.getTime() + randomInt(1, 48) * 60 * 60 * 1000);
      }
      if (isDeleted) {
        status = "deleted_by_author";
      }

      // Insert immediately so this comment gets a real ID
      // before any subsequent comment can reference it as a parent
      const inserted = await db.insert(comments).values({
        debateId: debate.id,
        authorId: author.userId,
        parentId,
        rootId,
        depth,
        content: commentData.content,
        stanceSide: commentData.stanceSide,
        ancestorPath,
        isQuarantined,
        quarantineReason: quarantineReason ?? null,
        status,
        score: 0,
        createdAt,
        editedAt: editedAt ?? null,
      }).returning();

      const real = inserted[0]!;
      debateComments.push(real);
      allInsertedComments.push(real);
    }
  }

  console.log(`   Inserted ${allInsertedComments.length} comments.\n`);

  // We need to fix the thread structure since comments were built with placeholder IDs
  // Re-process: for each debate, re-assign parentId/rootId using the real inserted comments
  // Actually, the issue is that debateComments had placeholder IDs when building thread refs.
  // Let's rebuild thread structure with a second pass.

  // Rebuild: group all inserted comments by debate and update parent/root references
  // For simplicity in the seed, we'll update parentId/rootId after all inserts
  const commentsByDebate = new Map<string, InsertedComment[]>();
  for (const c of allInsertedComments) {
    if (!commentsByDebate.has(c.debateId)) {
      commentsByDebate.set(c.debateId, []);
    }
    commentsByDebate.get(c.debateId)!.push(c);
  }

  console.log("   Fixing thread structure...");
  let threadUpdates = 0;
  for (const [, debateCommentList] of commentsByDebate) {
    const topLevel = debateCommentList.filter((c) => c.depth === 0);
    const replies = debateCommentList.filter((c) => c.depth > 0);

    for (const reply of replies) {
      if (topLevel.length === 0) continue;
      // Assign a random parent from the same debate
      const potentialParents = debateCommentList.filter(
        (c) => c.id !== reply.id && c.createdAt < reply.createdAt
      );
      if (potentialParents.length === 0) continue;

      const parent = randomItem(potentialParents);
      const rootId = parent.rootId ?? parent.id;
      const ancestorPath = [...(parent.ancestorPath ?? []), parent.id];
      const newDepth = parent.depth + 1;

      await db
        .update(comments)
        .set({
          parentId: parent.id,
          rootId,
          ancestorPath,
          depth: newDepth,
        })
        .where(eq(comments.id, reply.id));

      reply.parentId = parent.id;
      reply.rootId = rootId;
      reply.ancestorPath = ancestorPath;
      reply.depth = newDepth;
      threadUpdates++;
    }
  }
  console.log(`   Fixed ${threadUpdates} thread references.\n`);

  // ── 6. Insert votes ──────────────────────────────────────────────
  console.log("6. Inserting votes...");

  const upReasonWeights = [40, 20, 5, 20, 15]; // well_reasoned, well_sourced, changed_my_mind, strong_counterpoint, well_written
  const downReasonWeights = [20, 10, 25, 15, 30]; // off_topic, uncivil, misleading_unsourced, misrepresented_stance, low_effort

  const voteInserts: {
    commentId: string;
    userId: string;
    direction: "up" | "down";
    reason: VoteReason;
    weight: number;
    createdAt: Date;
  }[] = [];

  const voteUniqueness = new Set<string>();

  for (const comment of allInsertedComments) {
    let upCount: number;
    let downCount: number;

    if (comment.isQuarantined) {
      upCount = randomInt(0, 2);
      downCount = randomInt(5, 10);
    } else {
      // Find quality from the pool
      let quality: "high" | "medium" | "low" = "medium";
      const debateIdx = insertedDebates.findIndex((d) => d.id === comment.debateId);
      if (debateIdx >= 0 && COMMENT_POOLS[debateIdx]) {
        const poolComment = COMMENT_POOLS[debateIdx]!.find(
          (pc) => pc.content === comment.content
        );
        if (poolComment) {
          quality = poolComment.quality;
        }
      }

      switch (quality) {
        case "high":
          upCount = randomInt(15, 25);
          downCount = randomInt(0, 3);
          break;
        case "medium":
          upCount = randomInt(5, 12);
          downCount = randomInt(1, 5);
          break;
        case "low":
          upCount = randomInt(1, 4);
          downCount = randomInt(3, 8);
          break;
      }
    }

    // Get potential voters (not the comment author)
    const potentialVoters = insertedUsers.filter(
      (u) => u.id !== comment.authorId
    );

    // Generate upvotes
    const shuffledForUp = [...potentialVoters].sort(() => Math.random() - 0.5);
    let upGenerated = 0;
    for (const voter of shuffledForUp) {
      if (upGenerated >= upCount) break;
      const key = `${voter.id}:${comment.id}`;
      if (voteUniqueness.has(key)) continue;
      voteUniqueness.add(key);

      const reason = comment.isQuarantined
        ? randomItem([...upReasons])
        : weightedRandom([...upReasons], upReasonWeights);

      voteInserts.push({
        commentId: comment.id,
        userId: voter.id,
        direction: "up",
        reason,
        weight: trustWeight(voter.trustTier),
        createdAt: randomDateBetween(
          comment.createdAt,
          new Date(
            Math.min(
              comment.createdAt.getTime() + 60 * 24 * 60 * 60 * 1000,
              YEAR_END.getTime()
            )
          )
        ),
      });
      upGenerated++;
    }

    // Generate downvotes
    const shuffledForDown = [...potentialVoters].sort(() => Math.random() - 0.5);
    let downGenerated = 0;
    for (const voter of shuffledForDown) {
      if (downGenerated >= downCount) break;
      const key = `${voter.id}:${comment.id}`;
      if (voteUniqueness.has(key)) continue;
      voteUniqueness.add(key);

      const reason = comment.isQuarantined
        ? weightedRandom([...downReasons], [5, 40, 25, 15, 15])
        : weightedRandom([...downReasons], downReasonWeights);

      voteInserts.push({
        commentId: comment.id,
        userId: voter.id,
        direction: "down",
        reason,
        weight: trustWeight(voter.trustTier),
        createdAt: randomDateBetween(
          comment.createdAt,
          new Date(
            Math.min(
              comment.createdAt.getTime() + 60 * 24 * 60 * 60 * 1000,
              YEAR_END.getTime()
            )
          )
        ),
      });
      downGenerated++;
    }
  }

  // Insert votes in batches of 50
  let totalVotes = 0;
  for (let i = 0; i < voteInserts.length; i += 50) {
    const batch = voteInserts.slice(i, i + 50);
    await db.insert(votes).values(batch);
    totalVotes += batch.length;
  }
  console.log(`   Inserted ${totalVotes} votes.\n`);

  // ── 7. Update comment scores ─────────────────────────────────────
  console.log("7. Updating comment scores...");

  // Build score map from voteInserts
  const scoreMap = new Map<string, number>();
  for (const v of voteInserts) {
    const current = scoreMap.get(v.commentId) ?? 0;
    let multiplier: number;
    if (v.direction === "down") {
      multiplier = -1;
    } else if (v.reason === "changed_my_mind") {
      multiplier = 3;
    } else if (v.reason === "well_sourced") {
      multiplier = 2;
    } else {
      multiplier = 1;
    }
    scoreMap.set(v.commentId, current + v.weight * multiplier);
  }

  let scoreUpdates = 0;
  for (const [commentId, score] of scoreMap) {
    await db
      .update(comments)
      .set({ score: Math.round(score) })
      .where(eq(comments.id, commentId));
    scoreUpdates++;
  }
  console.log(`   Updated ${scoreUpdates} comment scores.\n`);

  // ── 8. Insert stance shifts ──────────────────────────────────────
  console.log("8. Inserting stance shifts...");

  // Find comments that received changed_my_mind votes
  const changedMyMindComments = voteInserts
    .filter((v) => v.reason === "changed_my_mind")
    .map((v) => v.commentId);
  const uniqueChangedCommentIds = [...new Set(changedMyMindComments)];

  const shiftNotes = [
    "The argument about scriptural interpretation really challenged my assumptions",
    "After reading this, I can no longer hold my previous position in good conscience",
    "The historical evidence presented here was compelling and changed my view",
    "I had not considered this perspective from the early church fathers before",
    "The logical consistency of this argument forced me to reconsider",
    "This comment exposed a blind spot in my theological framework",
    "The pastoral implications raised here shifted my thinking substantially",
    "I was convicted by the biblical exegesis in this thread",
    "The cross-cultural perspective opened my eyes to my own cultural bias",
    "After much prayer and reflection on this argument, I changed my stance",
    "The distinction drawn here between practice and doctrine was illuminating",
    "I realized my position was based more on tradition than on careful reading",
    "This argument about the original Greek text was particularly persuasive",
    "The ethical implications outlined here demanded I reconsider my view",
    "Seeing how multiple passages interconnect in this way changed everything",
    "The testimony shared here alongside the theological argument was powerful",
    "I had been operating with a caricature of this position until reading this",
    "The nuance in this argument made me realize I was creating a false dichotomy",
    "After engaging with this perspective for weeks, I find myself convinced",
    "The weight of scholarly consensus presented here was hard to ignore",
  ];

  const shiftInserts: {
    debateId: string;
    userId: string;
    fromStance: "side_a" | "side_b" | "neutral";
    toStance: "side_a" | "side_b" | "neutral";
    triggeredByCommentId: string;
    shiftedAt: Date;
    note: string;
  }[] = [];

  const shiftCount = randomInt(15, 20);
  const usedShiftKeys = new Set<string>();

  for (
    let i = 0;
    i < Math.min(shiftCount, uniqueChangedCommentIds.length);
    i++
  ) {
    const triggerCommentId = uniqueChangedCommentIds[i]!;
    const triggerComment = allInsertedComments.find(
      (c) => c.id === triggerCommentId
    );
    if (!triggerComment) continue;

    // Find a user who has a stance in this debate and could shift
    const debateParticipants = debateStanceMap.get(triggerComment.debateId);
    if (!debateParticipants || debateParticipants.length < 2) continue;

    // Pick someone with a different stance than the comment
    const candidates = debateParticipants.filter(
      (p) =>
        p.stance !== triggerComment.stanceSide &&
        p.userId !== triggerComment.authorId
    );
    if (candidates.length === 0) continue;

    const shifter = randomItem(candidates);
    const shiftKey = `${shifter.userId}:${triggerComment.debateId}`;
    if (usedShiftKeys.has(shiftKey)) continue;
    usedShiftKeys.add(shiftKey);

    const fromStance = shifter.stance as "side_a" | "side_b" | "neutral";
    // Shift toward comment's stance side
    const toStance = (triggerComment.stanceSide === "meta"
      ? "neutral"
      : triggerComment.stanceSide) as "side_a" | "side_b" | "neutral";

    if (fromStance === toStance) continue;

    shiftInserts.push({
      debateId: triggerComment.debateId,
      userId: shifter.userId,
      fromStance,
      toStance,
      triggeredByCommentId: triggerCommentId,
      shiftedAt: randomDateBetween(triggerComment.createdAt, YEAR_END),
      note: shiftNotes[i % shiftNotes.length]!,
    });
  }

  if (shiftInserts.length > 0) {
    await db.insert(stanceShifts).values(shiftInserts);

    // Update the debateStance records for shifted users
    for (const shift of shiftInserts) {
      await db
        .update(debateStances)
        .set({
          previousStance: shift.fromStance,
          declaredStance: shift.toStance,
          changedAt: shift.shiftedAt,
        })
        .where(eq(debateStances.id,
          insertedStances.find(
            (s) => s.userId === shift.userId && s.debateId === shift.debateId
          )?.id ?? ""
        ));
    }
  }

  console.log(`   Inserted ${shiftInserts.length} stance shifts.\n`);

  // ── 9. Insert verdict votes ──────────────────────────────────────
  console.log("9. Inserting verdict votes...");

  const verdictSides = ["side_a", "side_b", "draw"] as const;
  const verdictInserts: {
    debateId: string;
    voterId: string;
    winningSide: (typeof verdictSides)[number];
    voterStance: "side_a" | "side_b" | "neutral";
    pinnedCommentId: string | null;
    createdAt: Date;
  }[] = [];

  const verdictKeys = new Set<string>();

  // Find users with neutral stances and have them cast verdicts
  for (const stance of insertedStances) {
    if (stance.declaredStance !== "neutral") continue;

    const key = `${stance.debateId}:${stance.userId}`;
    if (verdictKeys.has(key)) continue;
    verdictKeys.add(key);

    // Find high-scoring comments in this debate to pin
    const debateCommentList = commentsByDebate.get(stance.debateId) ?? [];
    const highScoreComments = debateCommentList
      .filter((c) => (scoreMap.get(c.id) ?? 0) > 5)
      .sort((a, b) => (scoreMap.get(b.id) ?? 0) - (scoreMap.get(a.id) ?? 0));

    const pinnedComment =
      highScoreComments.length > 0 && Math.random() > 0.4
        ? highScoreComments[0]!
        : null;

    verdictInserts.push({
      debateId: stance.debateId,
      voterId: stance.userId,
      winningSide: randomItem([...verdictSides]),
      voterStance: "neutral",
      pinnedCommentId: pinnedComment?.id ?? null,
      createdAt: randomDateBetween(stance.declaredAt, YEAR_END),
    });

    if (verdictInserts.length >= 35) break;
  }

  if (verdictInserts.length > 0) {
    await db.insert(verdictVotes).values(verdictInserts);
  }
  console.log(`   Inserted ${verdictInserts.length} verdict votes.\n`);

  // ── 10. Insert argument tags ─────────────────────────────────────
  console.log("10. Inserting argument tags...");

  const taxonomyValues = [
    "empirical",
    "moral_ethical",
    "economic",
    "procedural",
    "anecdotal",
    "legal",
    "historical",
  ] as const;

  // Pick established+ users as taggers
  const taggers = insertedUsers.filter((u) =>
    ["established", "trusted", "moderator", "admin"].includes(u.trustTier)
  );

  const tagInserts: {
    commentId: string;
    taxonomy: (typeof taxonomyValues)[number];
    taggedBy: string;
    createdAt: Date;
  }[] = [];

  const taggedCommentIds = new Set<string>();

  for (const comment of allInsertedComments) {
    if (tagInserts.length >= 120) break;
    if (comment.status === "deleted_by_author") continue;
    if (Math.random() > 0.2) continue; // Tag ~20% of comments

    // Use taxonomy hint from pool if available
    const debateIdx = insertedDebates.findIndex((d) => d.id === comment.debateId);
    let taxonomy: (typeof taxonomyValues)[number] | undefined;
    if (debateIdx >= 0 && COMMENT_POOLS[debateIdx]) {
      const poolComment = COMMENT_POOLS[debateIdx]!.find(
        (pc) => pc.content === comment.content
      );
      if (poolComment?.taxonomy) {
        taxonomy = poolComment.taxonomy as (typeof taxonomyValues)[number];
      }
    }
    if (!taxonomy) {
      taxonomy = randomItem([...taxonomyValues]);
    }

    const tagger = randomItem(taggers);
    const tagKey = `${comment.id}:${taxonomy}`;
    if (taggedCommentIds.has(tagKey)) continue;
    taggedCommentIds.add(tagKey);

    tagInserts.push({
      commentId: comment.id,
      taxonomy,
      taggedBy: tagger.id,
      createdAt: randomDateBetween(comment.createdAt, YEAR_END),
    });
  }

  if (tagInserts.length > 0) {
    // Insert in batches of 50
    for (let i = 0; i < tagInserts.length; i += 50) {
      const batch = tagInserts.slice(i, i + 50);
      await db.insert(argumentTags).values(batch);
    }
  }
  console.log(`   Inserted ${tagInserts.length} argument tags.\n`);

  // ── 11. Insert burden of proof requests ──────────────────────────
  console.log("11. Inserting burden of proof requests...");

  // Find comments with misleading_unsourced downvotes
  const misleadingCommentIds = [
    ...new Set(
      voteInserts
        .filter((v) => v.reason === "misleading_unsourced")
        .map((v) => v.commentId)
    ),
  ];

  const bopStatuses = [
    "pending",
    "citation_provided",
    "upheld",
    "dismissed",
  ] as const;

  const bopInserts: {
    commentId: string;
    flagCount: number;
    status: (typeof bopStatuses)[number];
    citationUrl: string | null;
    citationUpvotes: number;
    createdAt: Date;
    resolvedAt: Date | null;
  }[] = [];

  const bopCount = randomInt(5, 8);
  const usedBopComments = new Set<string>();

  for (let i = 0; i < Math.min(bopCount, misleadingCommentIds.length); i++) {
    const commentId = misleadingCommentIds[i]!;
    if (usedBopComments.has(commentId)) continue;
    usedBopComments.add(commentId);

    const comment = allInsertedComments.find((c) => c.id === commentId);
    if (!comment) continue;

    const status = bopStatuses[i % bopStatuses.length]!;
    const createdAt = randomDateBetween(comment.createdAt, YEAR_END);

    bopInserts.push({
      commentId,
      flagCount: randomInt(3, 12),
      status,
      citationUrl:
        status === "citation_provided" || status === "upheld"
          ? `https://scholar.google.com/citation/${randomInt(100000, 999999)}`
          : null,
      citationUpvotes: status === "upheld" ? randomInt(5, 15) : 0,
      createdAt,
      resolvedAt:
        status !== "pending"
          ? randomDateBetween(createdAt, YEAR_END)
          : null,
    });
  }

  if (bopInserts.length > 0) {
    await db.insert(burdenOfProofRequests).values(bopInserts);
  }
  console.log(
    `   Inserted ${bopInserts.length} burden of proof requests.\n`
  );

  // ── 12. Print summary ────────────────────────────────────────────
  console.log("=== Seed Summary ===");
  console.log(`  Users:                ${insertedUsers.length}`);
  console.log(`  Debates:              ${insertedDebates.length}`);
  console.log(`  Stances:              ${insertedStances.length}`);
  console.log(`  Comments:             ${allInsertedComments.length}`);
  console.log(`  Votes:                ${totalVotes}`);
  console.log(`  Stance Shifts:        ${shiftInserts.length}`);
  console.log(`  Verdict Votes:        ${verdictInserts.length}`);
  console.log(`  Argument Tags:        ${tagInserts.length}`);
  console.log(`  Burden of Proof:      ${bopInserts.length}`);
  console.log("\n=== Seed Complete ===");
}

// ── 13. Run and exit ───────────────────────────────────────────────

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
