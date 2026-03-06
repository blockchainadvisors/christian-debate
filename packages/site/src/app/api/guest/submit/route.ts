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
import type { GuestComment, GuestVote } from "@/types/guest";

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

  // Cap validation
  if (guestComments.length > MAX_COMMENTS || guestVotes.length > MAX_VOTES) {
    return NextResponse.json({ error: "Exceeds guest limits" }, { status: 400 });
  }

  const errors: Array<{ localId: string; error: string }> = [];
  let submittedComments = 0;
  let submittedVotes = 0;

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
      // Validate stance
      if (!VALID_STANCES.includes(gc.stanceSide as any)) {
        errors.push({ localId: gc.localId, error: "Invalid stance" });
        continue;
      }

      // Validate content
      if (!gc.content || gc.content.trim().length < 1) {
        errors.push({ localId: gc.localId, error: "Empty content" });
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
        continue;
      }

      if (debate.status !== "open") {
        errors.push({ localId: gc.localId, error: "Debate is locked" });
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
    }
  }

  // Process votes
  for (const gv of guestVotes) {
    try {
      // Validate direction
      if (gv.direction !== "up" && gv.direction !== "down") {
        errors.push({ localId: gv.localId, error: "Invalid direction" });
        continue;
      }

      // Validate reason
      if (gv.direction === "up" && !UPVOTE_REASONS.includes(gv.reason as any)) {
        errors.push({ localId: gv.localId, error: "Invalid reason" });
        continue;
      }
      if (gv.direction === "down" && !DOWNVOTE_REASONS.includes(gv.reason as any)) {
        errors.push({ localId: gv.localId, error: "Invalid reason" });
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
    }
  }

  return NextResponse.json({ submittedComments, submittedVotes, errors });
}
