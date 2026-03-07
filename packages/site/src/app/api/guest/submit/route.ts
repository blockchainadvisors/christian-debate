import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { comments, votes, users, debates } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import {
  UPVOTE_REASONS,
  DOWNVOTE_REASONS,
  TRUST_TIER_WEIGHTS,
  computeCommentScore,
} from "@/lib/vote-scoring";
import type { GuestComment, GuestVote, GuestStance, ConflictResolutions } from "@/types/guest";
import { debateStances } from "@/db/schema";

const MAX_COMMENTS = 50;
const MAX_VOTES = 100;
const VALID_STANCES = ["side_a", "side_b", "neutral", "meta"] as const;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const guestComments: GuestComment[] = body.comments ?? [];
  const guestVotes: GuestVote[] = body.votes ?? [];
  const guestStances: GuestStance[] = body.stances ?? [];
  const resolutions: ConflictResolutions | undefined = body.resolutions;

  // Cap validation
  if (guestComments.length > MAX_COMMENTS || guestVotes.length > MAX_VOTES) {
    return NextResponse.json({ error: "Exceeds guest limits" }, { status: 400 });
  }

  const errors: Array<{ localId: string; error: string }> = [];
  const failedLocalIds: string[] = [];
  let submittedComments = 0;
  let submittedVotes = 0;
  let skippedComments = 0;
  let skippedVotes = 0;
  let skippedStances = 0;

  // Map guest localId -> server ID for resolving reply chains
  const localIdToServerId = new Map<string, string>();

  // Look up user's trust tier
  const [user] = await db
    .select({ trustTier: users.trustTier })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const weight = TRUST_TIER_WEIGHTS[user.trustTier] ?? 1.0;

  // Process comments in createdAt order
  const sortedComments = [...guestComments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  for (const gc of sortedComments) {
    try {
      // Check resolution for this comment
      const commentResolution = resolutions?.comments?.[gc.localId];
      if (commentResolution === "skip") {
        skippedComments++;
        continue;
      }

      // Validate stance
      if (!VALID_STANCES.includes(gc.stanceSide as any)) {
        errors.push({ localId: gc.localId, error: "Invalid stance" });
        failedLocalIds.push(gc.localId);
        continue;
      }

      // Validate content
      if (!gc.content || gc.content.trim().length < 1) {
        errors.push({ localId: gc.localId, error: "Empty content" });
        failedLocalIds.push(gc.localId);
        continue;
      }

      // Find debate
      const [debate] = await db
        .select({ id: debates.id, status: debates.status })
        .from(debates)
        .where(eq(debates.slug, gc.debateSlug))
        .limit(1);

      if (!debate) {
        errors.push({ localId: gc.localId, error: "Debate not found" });
        failedLocalIds.push(gc.localId);
        continue;
      }

      if (debate.status !== "open") {
        errors.push({ localId: gc.localId, error: "Debate is locked" });
        failedLocalIds.push(gc.localId);
        continue;
      }

      // Resolve parentId
      let resolvedParentId: string | null = null;
      let depth = 0;
      let rootId: string | null = null;
      let ancestorPath: string[] = [];

      if (gc.parentId) {
        // Check if parent is a guest localId that was already inserted
        const serverId = localIdToServerId.get(gc.parentId);
        resolvedParentId = serverId ?? gc.parentId;

        // Look up parent comment
        const [parent] = await db
          .select()
          .from(comments)
          .where(and(eq(comments.id, resolvedParentId), eq(comments.debateId, debate.id)))
          .limit(1);

        if (!parent) {
          errors.push({ localId: gc.localId, error: "Parent comment not found" });
          failedLocalIds.push(gc.localId);
          continue;
        }

        depth = parent.depth + 1;
        rootId = parent.rootId ?? parent.id;
        ancestorPath = [...(parent.ancestorPath ?? []), parent.id];
      }

      // Insert comment
      const [created] = await db
        .insert(comments)
        .values({
          debateId: debate.id,
          authorId: session.user.id,
          parentId: resolvedParentId,
          rootId,
          depth,
          content: gc.content.trim(),
          stanceSide: gc.stanceSide,
          ancestorPath,
        })
        .returning({ id: comments.id });

      localIdToServerId.set(gc.localId, created.id);
      submittedComments++;
    } catch (err) {
      errors.push({ localId: gc.localId, error: "Server error" });
      failedLocalIds.push(gc.localId);
    }
  }

  // Process votes
  for (const gv of guestVotes) {
    try {
      // Check resolution for this vote
      const voteResolution = resolutions?.votes?.[gv.localId];
      if (voteResolution === "keep_existing" || voteResolution === "skip") {
        skippedVotes++;
        continue;
      }

      // Validate direction
      if (gv.direction !== "up" && gv.direction !== "down") {
        errors.push({ localId: gv.localId, error: "Invalid direction" });
        failedLocalIds.push(gv.localId);
        continue;
      }

      // Validate reason
      if (gv.direction === "up" && !UPVOTE_REASONS.includes(gv.reason as any)) {
        errors.push({ localId: gv.localId, error: "Invalid reason" });
        failedLocalIds.push(gv.localId);
        continue;
      }
      if (gv.direction === "down" && !DOWNVOTE_REASONS.includes(gv.reason as any)) {
        errors.push({ localId: gv.localId, error: "Invalid reason" });
        failedLocalIds.push(gv.localId);
        continue;
      }

      // Resolve commentId (might be a guest localId)
      const resolvedCommentId = localIdToServerId.get(gv.commentId) ?? gv.commentId;

      // Verify comment exists
      const [comment] = await db
        .select({ id: comments.id })
        .from(comments)
        .where(eq(comments.id, resolvedCommentId))
        .limit(1);

      if (!comment) {
        errors.push({ localId: gv.localId, error: "Comment not found" });
        failedLocalIds.push(gv.localId);
        continue;
      }

      // Upsert vote
      await db
        .insert(votes)
        .values({
          commentId: resolvedCommentId,
          userId: session.user.id,
          direction: gv.direction,
          reason: gv.reason,
          weight,
        })
        .onConflictDoUpdate({
          target: [votes.userId, votes.commentId],
          set: {
            direction: gv.direction,
            reason: gv.reason,
            weight,
            createdAt: new Date(),
          },
        });

      // Recompute score
      const allVotes = await db
        .select({
          direction: votes.direction,
          reason: votes.reason,
          weight: votes.weight,
        })
        .from(votes)
        .where(eq(votes.commentId, resolvedCommentId));

      const newScore = computeCommentScore(allVotes);
      await db
        .update(comments)
        .set({ score: newScore })
        .where(eq(comments.id, resolvedCommentId));

      submittedVotes++;
    } catch (err) {
      errors.push({ localId: gv.localId, error: "Server error" });
      failedLocalIds.push(gv.localId);
    }
  }

  // Process stances
  let submittedStances = 0;
  const VALID_STANCE_SIDES = ["side_a", "side_b", "neutral"] as const;

  for (const gs of guestStances) {
    try {
      // Check resolution for this stance
      const stanceResolution = resolutions?.stances?.[gs.debateSlug];
      if (stanceResolution === "keep_existing" || stanceResolution === "skip") {
        skippedStances++;
        continue;
      }

      if (!VALID_STANCE_SIDES.includes(gs.declaredStance as any)) continue;

      const [debate] = await db
        .select({ id: debates.id })
        .from(debates)
        .where(eq(debates.slug, gs.debateSlug))
        .limit(1);

      if (!debate) {
        errors.push({ localId: gs.debateSlug, error: "Debate not found" });
        continue;
      }

      // Upsert stance
      const [existing] = await db
        .select({ id: debateStances.id, declaredStance: debateStances.declaredStance })
        .from(debateStances)
        .where(
          and(
            eq(debateStances.debateId, debate.id),
            eq(debateStances.userId, session.user.id)
          )
        )
        .limit(1);

      if (existing) {
        await db
          .update(debateStances)
          .set({
            previousStance: existing.declaredStance,
            declaredStance: gs.declaredStance,
            changedAt: new Date(),
          })
          .where(eq(debateStances.id, existing.id));
      } else {
        await db.insert(debateStances).values({
          debateId: debate.id,
          userId: session.user.id,
          declaredStance: gs.declaredStance,
        });
      }

      submittedStances++;
    } catch (err) {
      errors.push({ localId: gs.debateSlug, error: "Server error" });
    }
  }

  return NextResponse.json({
    submittedComments,
    submittedVotes,
    submittedStances,
    skippedComments,
    skippedVotes,
    skippedStances,
    errors,
    failedLocalIds,
  });
}
