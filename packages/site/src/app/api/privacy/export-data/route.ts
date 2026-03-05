import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  users,
  comments,
  votes,
  debateStances,
  stanceShifts,
  verdictVotes,
  federatedIdentity,
} from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Export all user data as a JSON download (GDPR data portability).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Fetch user profile
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        email: users.email,
        avatarUrl: users.avatarUrl,
        trustTier: users.trustTier,
        reputationScore: users.reputationScore,
        persuasionRating: users.persuasionRating,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch all comments (full content)
    const userComments = await db
      .select({
        id: comments.id,
        debateId: comments.debateId,
        content: comments.content,
        stanceSide: comments.stanceSide,
        status: comments.status,
        score: comments.score,
        createdAt: comments.createdAt,
        editedAt: comments.editedAt,
      })
      .from(comments)
      .where(eq(comments.authorId, userId));

    // Fetch all votes
    const userVotes = await db
      .select({
        id: votes.id,
        commentId: votes.commentId,
        direction: votes.direction,
        reason: votes.reason,
        weight: votes.weight,
        createdAt: votes.createdAt,
      })
      .from(votes)
      .where(eq(votes.userId, userId));

    // Fetch debate stances
    const userStances = await db
      .select({
        id: debateStances.id,
        debateId: debateStances.debateId,
        declaredStance: debateStances.declaredStance,
        algorithmicLean: debateStances.algorithmicLean,
        leanConfidence: debateStances.leanConfidence,
        previousStance: debateStances.previousStance,
        declaredAt: debateStances.declaredAt,
        changedAt: debateStances.changedAt,
      })
      .from(debateStances)
      .where(eq(debateStances.userId, userId));

    // Fetch stance shifts
    const userStanceShifts = await db
      .select({
        id: stanceShifts.id,
        debateId: stanceShifts.debateId,
        fromStance: stanceShifts.fromStance,
        toStance: stanceShifts.toStance,
        triggeredByCommentId: stanceShifts.triggeredByCommentId,
        shiftedAt: stanceShifts.shiftedAt,
        note: stanceShifts.note,
      })
      .from(stanceShifts)
      .where(eq(stanceShifts.userId, userId));

    // Fetch verdict votes
    const userVerdictVotes = await db
      .select({
        id: verdictVotes.id,
        debateId: verdictVotes.debateId,
        winningSide: verdictVotes.winningSide,
        voterStance: verdictVotes.voterStance,
        pinnedCommentId: verdictVotes.pinnedCommentId,
        createdAt: verdictVotes.createdAt,
      })
      .from(verdictVotes)
      .where(eq(verdictVotes.voterId, userId));

    // Fetch federated identity
    const [fedIdentity] = await db
      .select({
        hubUserId: federatedIdentity.hubUserId,
        linkedAt: federatedIdentity.linkedAt,
        syncedAt: federatedIdentity.syncedAt,
      })
      .from(federatedIdentity)
      .where(eq(federatedIdentity.localUserId, userId))
      .limit(1);

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: user,
      federatedIdentity: fedIdentity ?? null,
      comments: userComments,
      votes: userVotes,
      debateStances: userStances,
      stanceShifts: userStanceShifts,
      verdictVotes: userVerdictVotes,
    };

    const json = JSON.stringify(exportData, null, 2);
    const filename = `user-data-export-${userId}-${Date.now()}.json`;

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[PRIVACY] Data export failed:", error);
    return NextResponse.json(
      { error: "Data export failed. Please try again." },
      { status: 500 },
    );
  }
}
