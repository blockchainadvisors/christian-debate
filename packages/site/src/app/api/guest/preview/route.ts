import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { comments, votes, debates, debateStances } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import type {
  GuestComment,
  GuestVote,
  GuestStance,
  VoteConflict,
  StanceConflict,
  CommentConflict,
  PreviewResponse,
} from "@/types/guest";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const guestComments: GuestComment[] = body.comments ?? [];
  const guestVotes: GuestVote[] = body.votes ?? [];
  const guestStances: GuestStance[] = body.stances ?? [];

  const userId = session.user.id;
  const voteConflicts: VoteConflict[] = [];
  const stanceConflicts: StanceConflict[] = [];
  const commentConflicts: CommentConflict[] = [];
  let cleanVotes = 0;
  let cleanComments = 0;
  let cleanStances = 0;

  // ─── Check vote conflicts ────────────────────────────────────────
  if (guestVotes.length > 0) {
    const commentIds = guestVotes.map((v) => v.commentId);

    const existingVotes = await db
      .select({
        commentId: votes.commentId,
        direction: votes.direction,
        reason: votes.reason,
      })
      .from(votes)
      .where(and(eq(votes.userId, userId), inArray(votes.commentId, commentIds)));

    const existingVoteMap = new Map(existingVotes.map((v) => [v.commentId, v]));

    // Batch-fetch comment previews and debate titles for conflicting votes
    const conflictCommentIds = guestVotes
      .filter((gv) => {
        const existing = existingVoteMap.get(gv.commentId);
        return existing && (existing.direction !== gv.direction || existing.reason !== gv.reason);
      })
      .map((gv) => gv.commentId);

    const commentInfoMap = new Map<string, { content: string; debateTitle: string }>();
    if (conflictCommentIds.length > 0) {
      const commentInfoRows = await db
        .select({
          id: comments.id,
          content: comments.content,
          debateTitle: debates.title,
        })
        .from(comments)
        .innerJoin(debates, eq(comments.debateId, debates.id))
        .where(inArray(comments.id, conflictCommentIds));

      for (const row of commentInfoRows) {
        commentInfoMap.set(row.id, { content: row.content, debateTitle: row.debateTitle });
      }
    }

    for (const gv of guestVotes) {
      const existing = existingVoteMap.get(gv.commentId);
      if (!existing) {
        cleanVotes++;
        continue;
      }
      if (existing.direction === gv.direction && existing.reason === gv.reason) {
        // Identical vote — no conflict, no action needed
        cleanVotes++;
        continue;
      }
      const info = commentInfoMap.get(gv.commentId);
      voteConflicts.push({
        localId: gv.localId,
        commentId: gv.commentId,
        commentPreview: (info?.content ?? "").slice(0, 80),
        debateTitle: info?.debateTitle ?? "Unknown debate",
        guestDirection: gv.direction,
        guestReason: gv.reason,
        existingDirection: existing.direction as "up" | "down",
        existingReason: existing.reason as VoteConflict["existingReason"],
      });
    }
  }

  // ─── Check stance conflicts ──────────────────────────────────────
  if (guestStances.length > 0) {
    const debateSlugs = guestStances.map((s) => s.debateSlug);

    const debateRows = await db
      .select({
        id: debates.id,
        slug: debates.slug,
        title: debates.title,
        sideALabel: debates.sideALabel,
        sideBLabel: debates.sideBLabel,
      })
      .from(debates)
      .where(inArray(debates.slug, debateSlugs));

    const debateMap = new Map(debateRows.map((d) => [d.slug, d]));
    const debateIds = debateRows.map((d) => d.id);

    const existingStances =
      debateIds.length > 0
        ? await db
            .select({
              debateId: debateStances.debateId,
              declaredStance: debateStances.declaredStance,
            })
            .from(debateStances)
            .where(
              and(eq(debateStances.userId, userId), inArray(debateStances.debateId, debateIds))
            )
        : [];

    const existingStanceMap = new Map(existingStances.map((s) => [s.debateId, s]));

    for (const gs of guestStances) {
      const debate = debateMap.get(gs.debateSlug);
      if (!debate) continue;

      const existing = existingStanceMap.get(debate.id);
      if (!existing) {
        cleanStances++;
        continue;
      }
      if (existing.declaredStance === gs.declaredStance) {
        cleanStances++;
        continue;
      }
      stanceConflicts.push({
        debateSlug: gs.debateSlug,
        debateTitle: debate.title,
        sideALabel: debate.sideALabel,
        sideBLabel: debate.sideBLabel,
        guestStance: gs.declaredStance,
        existingStance: existing.declaredStance as StanceConflict["existingStance"],
      });
    }
  }

  // ─── Check comment duplicates ────────────────────────────────────
  if (guestComments.length > 0) {
    const debateSlugs = [...new Set(guestComments.map((c) => c.debateSlug))];
    const debateRows = await db
      .select({ id: debates.id, slug: debates.slug, title: debates.title })
      .from(debates)
      .where(inArray(debates.slug, debateSlugs));

    const debateMap = new Map(debateRows.map((d) => [d.slug, d]));
    const debateIds = debateRows.map((d) => d.id);

    // Fetch user's existing comments in these debates
    const existingComments =
      debateIds.length > 0
        ? await db
            .select({
              id: comments.id,
              debateId: comments.debateId,
              content: comments.content,
            })
            .from(comments)
            .where(
              and(eq(comments.authorId, userId), inArray(comments.debateId, debateIds))
            )
        : [];

    // Group by debateId for efficient lookup
    const existingByDebate = new Map<string, Array<{ id: string; content: string }>>();
    for (const ec of existingComments) {
      const arr = existingByDebate.get(ec.debateId) ?? [];
      arr.push({ id: ec.id, content: ec.content });
      existingByDebate.set(ec.debateId, arr);
    }

    for (const gc of guestComments) {
      const debate = debateMap.get(gc.debateSlug);
      if (!debate) {
        cleanComments++;
        continue;
      }

      const debateComments = existingByDebate.get(debate.id) ?? [];
      const trimmedContent = gc.content.trim();
      const duplicate = debateComments.find((ec) => ec.content.trim() === trimmedContent);

      if (duplicate) {
        commentConflicts.push({
          localId: gc.localId,
          debateSlug: gc.debateSlug,
          debateTitle: debate.title,
          contentPreview: trimmedContent.slice(0, 120),
          existingCommentId: duplicate.id,
        });
      } else {
        cleanComments++;
      }
    }
  }

  const hasConflicts =
    voteConflicts.length > 0 || stanceConflicts.length > 0 || commentConflicts.length > 0;

  const response: PreviewResponse = {
    conflicts: {
      votes: voteConflicts,
      stances: stanceConflicts,
      comments: commentConflicts,
    },
    clean: { comments: cleanComments, votes: cleanVotes, stances: cleanStances },
    hasConflicts,
  };

  return NextResponse.json(response);
}
