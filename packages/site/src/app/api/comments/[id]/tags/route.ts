import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { argumentTags, users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { TAXONOMY_VALUES, type ArgumentTaxonomy } from "@/types/taxonomy";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: commentId } = await params;

  const results = await db
    .select({
      taxonomy: argumentTags.taxonomy,
      count: sql<number>`count(*)::int`,
    })
    .from(argumentTags)
    .where(eq(argumentTags.commentId, commentId))
    .groupBy(argumentTags.taxonomy);

  return NextResponse.json({ tags: results });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Check trust tier
  const [user] = await db
    .select({ trustTier: users.trustTier })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || user.trustTier === "new") {
    return NextResponse.json(
      { error: "You must have 'established' status or higher to tag arguments" },
      { status: 403 }
    );
  }

  const { id: commentId } = await params;
  const body = await request.json();
  const { taxonomy } = body;

  // Validate taxonomy value
  if (!taxonomy || !TAXONOMY_VALUES.includes(taxonomy as ArgumentTaxonomy)) {
    return NextResponse.json(
      { error: "Invalid taxonomy value" },
      { status: 400 }
    );
  }

  // Check for duplicate
  const [existing] = await db
    .select({ id: argumentTags.id })
    .from(argumentTags)
    .where(
      and(
        eq(argumentTags.commentId, commentId),
        eq(argumentTags.taxonomy, taxonomy),
        eq(argumentTags.taggedBy, userId)
      )
    )
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "You have already tagged this comment with this taxonomy" },
      { status: 409 }
    );
  }

  const [tag] = await db
    .insert(argumentTags)
    .values({
      commentId,
      taxonomy,
      taggedBy: userId,
    })
    .returning();

  return NextResponse.json({ tag }, { status: 201 });
}
