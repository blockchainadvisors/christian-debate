import { NextRequest, NextResponse } from "next/server";
import { eq, desc, count } from "drizzle-orm";
import { db } from "@/db";
import { users, comments, debates, debateStances } from "@/db/schema";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      trustTier: users.trustTier,
      reputationScore: users.reputationScore,
      persuasionRating: users.persuasionRating,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Comment count
  const [commentCountResult] = await db
    .select({ value: count() })
    .from(comments)
    .where(eq(comments.authorId, user.id));

  // Debate count
  const debateCountResult = await db
    .selectDistinct({ debateId: debateStances.debateId })
    .from(debateStances)
    .where(eq(debateStances.userId, user.id));

  // Recent comments
  const recentComments = await db
    .select({
      id: comments.id,
      content: comments.content,
      score: comments.score,
      stanceSide: comments.stanceSide,
      createdAt: comments.createdAt,
      debateTitle: debates.title,
      debateSlug: debates.slug,
    })
    .from(comments)
    .innerJoin(debates, eq(comments.debateId, debates.id))
    .where(eq(comments.authorId, user.id))
    .orderBy(desc(comments.createdAt))
    .limit(10);

  // Stances
  const stances = await db
    .select({
      declaredStance: debateStances.declaredStance,
      declaredAt: debateStances.declaredAt,
      debateTitle: debates.title,
      debateSlug: debates.slug,
    })
    .from(debateStances)
    .innerJoin(debates, eq(debateStances.debateId, debates.id))
    .where(eq(debateStances.userId, user.id))
    .orderBy(desc(debateStances.declaredAt));

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      trustTier: user.trustTier,
      createdAt: user.createdAt,
    },
    stats: {
      reputationScore: user.reputationScore,
      persuasionRating: user.persuasionRating,
      commentCount: commentCountResult?.value ?? 0,
      debateCount: debateCountResult.length,
    },
    recentComments,
    stances,
  });
}
