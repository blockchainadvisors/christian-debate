import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { comments, users, debates } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

const VALID_STANCES = ["side_a", "side_b", "neutral", "meta"] as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Find debate by slug
    const [debate] = await db
      .select({ id: debates.id })
      .from(debates)
      .where(eq(debates.slug, slug))
      .limit(1);

    if (!debate) {
      return NextResponse.json({ error: "Debate not found" }, { status: 404 });
    }

    // Fetch all comments for this debate with author info
    const rows = await db
      .select({
        id: comments.id,
        debateId: comments.debateId,
        authorId: comments.authorId,
        parentId: comments.parentId,
        rootId: comments.rootId,
        depth: comments.depth,
        content: comments.content,
        stanceSide: comments.stanceSide,
        ancestorPath: comments.ancestorPath,
        isQuarantined: comments.isQuarantined,
        quarantineReason: comments.quarantineReason,
        status: comments.status,
        score: comments.score,
        createdAt: comments.createdAt,
        editedAt: comments.editedAt,
        authorDisplayName: users.displayName,
        authorUsername: users.username,
        authorAvatarUrl: users.avatarUrl,
      })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.debateId, debate.id))
      .orderBy(comments.createdAt);

    const result = rows.map((row) => ({
      id: row.id,
      debateId: row.debateId,
      authorId: row.authorId,
      parentId: row.parentId,
      rootId: row.rootId,
      depth: row.depth,
      content: row.content,
      stanceSide: row.stanceSide,
      ancestorPath: row.ancestorPath,
      isQuarantined: row.isQuarantined,
      quarantineReason: row.quarantineReason,
      status: row.status,
      score: row.score,
      createdAt: row.createdAt.toISOString(),
      editedAt: row.editedAt?.toISOString() ?? null,
      author: {
        id: row.authorId,
        displayName: row.authorDisplayName,
        username: row.authorUsername,
        avatarUrl: row.authorAvatarUrl,
      },
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/debates/[slug]/comments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    // Find debate by slug
    const [debate] = await db
      .select({ id: debates.id })
      .from(debates)
      .where(eq(debates.slug, slug))
      .limit(1);

    if (!debate) {
      return NextResponse.json({ error: "Debate not found" }, { status: 404 });
    }

    const body = await request.json();
    const { content, stanceSide, parentId } = body;

    // Validate content
    if (!content || typeof content !== "string" || content.trim().length < 1) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Validate stanceSide
    if (!VALID_STANCES.includes(stanceSide)) {
      return NextResponse.json(
        { error: "Invalid stance side" },
        { status: 400 }
      );
    }

    let depth = 0;
    let rootId: string | null = null;
    let ancestorPath: string[] = [];

    if (parentId) {
      // Look up parent comment
      const [parent] = await db
        .select()
        .from(comments)
        .where(
          and(eq(comments.id, parentId), eq(comments.debateId, debate.id))
        )
        .limit(1);

      if (!parent) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
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
        parentId: parentId ?? null,
        rootId,
        depth,
        content: content.trim(),
        stanceSide,
        ancestorPath,
      })
      .returning();

    // Fetch author info
    const [author] = await db
      .select({
        id: users.id,
        displayName: users.displayName,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    return NextResponse.json(
      {
        ...created,
        createdAt: created.createdAt.toISOString(),
        editedAt: created.editedAt?.toISOString() ?? null,
        author,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/debates/[slug]/comments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
