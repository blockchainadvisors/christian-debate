import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { debateStances, stanceShifts, debates, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";
import type { StanceSide } from "@/types/stances";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const debate = await db
    .select({ id: debates.id })
    .from(debates)
    .where(eq(debates.slug, slug))
    .limit(1)
    .then((rows) => rows[0]);

  if (!debate) {
    return NextResponse.json({ error: "Debate not found" }, { status: 404 });
  }

  const stances = await db
    .select({
      id: debateStances.id,
      debateId: debateStances.debateId,
      userId: debateStances.userId,
      declaredStance: debateStances.declaredStance,
      algorithmicLean: debateStances.algorithmicLean,
      leanConfidence: debateStances.leanConfidence,
      previousStance: debateStances.previousStance,
      declaredAt: debateStances.declaredAt,
      changedAt: debateStances.changedAt,
      userDisplayName: users.displayName,
      userUsername: users.username,
      userAvatarUrl: users.avatarUrl,
    })
    .from(debateStances)
    .innerJoin(users, eq(debateStances.userId, users.id))
    .where(eq(debateStances.debateId, debate.id));

  const formatted = stances.map((s) => ({
    id: s.id,
    debateId: s.debateId,
    userId: s.userId,
    declaredStance: s.declaredStance,
    algorithmicLean: s.algorithmicLean,
    leanConfidence: s.leanConfidence,
    previousStance: s.previousStance,
    declaredAt: s.declaredAt?.toISOString() ?? null,
    changedAt: s.changedAt?.toISOString() ?? null,
    user: {
      id: s.userId,
      displayName: s.userDisplayName,
      username: s.userUsername,
      avatarUrl: s.userAvatarUrl,
    },
  }));

  const summary = { sideA: 0, sideB: 0, neutral: 0 };
  for (const s of formatted) {
    if (s.declaredStance === "side_a") summary.sideA++;
    else if (s.declaredStance === "side_b") summary.sideB++;
    else summary.neutral++;
  }

  return NextResponse.json({ stances: formatted, summary });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const body = await request.json();
  const { declaredStance, triggeredByCommentId, note } = body as {
    declaredStance: StanceSide;
    triggeredByCommentId?: string;
    note?: string;
  };

  if (!["side_a", "side_b", "neutral"].includes(declaredStance)) {
    return NextResponse.json(
      { error: "Invalid stance. Must be side_a, side_b, or neutral." },
      { status: 400 }
    );
  }

  const debate = await db
    .select({ id: debates.id })
    .from(debates)
    .where(eq(debates.slug, slug))
    .limit(1)
    .then((rows) => rows[0]);

  if (!debate) {
    return NextResponse.json({ error: "Debate not found" }, { status: 404 });
  }

  const userId = session.user.id;

  // Check for existing stance
  const existing = await db
    .select()
    .from(debateStances)
    .where(
      and(
        eq(debateStances.debateId, debate.id),
        eq(debateStances.userId, userId)
      )
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (existing) {
    // Update existing stance
    const oldStance = existing.declaredStance;

    const [updated] = await db
      .update(debateStances)
      .set({
        declaredStance,
        previousStance: oldStance,
        changedAt: new Date(),
      })
      .where(eq(debateStances.id, existing.id))
      .returning();

    // Record the shift
    await db.insert(stanceShifts).values({
      debateId: debate.id,
      userId,
      fromStance: oldStance,
      toStance: declaredStance,
      triggeredByCommentId: triggeredByCommentId ?? null,
      note: note ?? null,
    });

    return NextResponse.json(updated);
  } else {
    // Insert new stance
    const [created] = await db
      .insert(debateStances)
      .values({
        debateId: debate.id,
        userId,
        declaredStance,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  }
}
