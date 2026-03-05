import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { comments, users, debates } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redis } from "@/lib/redis";
import type { CommentWithAuthor } from "@/types/comments";

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

    // Try Redis cache first
    const cacheKey = `debate:${debate.id}:sides`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached));
    }

    // Cache miss — query DB
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
      .orderBy(desc(comments.score));

    const toComment = (row: (typeof rows)[number]): CommentWithAuthor => ({
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
    });

    const sideA: CommentWithAuthor[] = [];
    const sideB: CommentWithAuthor[] = [];
    const neutral: CommentWithAuthor[] = [];

    for (const row of rows) {
      const comment = toComment(row);
      if (row.stanceSide === "side_a") {
        sideA.push(comment);
      } else if (row.stanceSide === "side_b") {
        sideB.push(comment);
      } else {
        // neutral and meta both go into neutral
        neutral.push(comment);
      }
    }

    const result = { sideA, sideB, neutral };

    // Cache for 60 seconds
    await redis.set(cacheKey, JSON.stringify(result), "EX", 60);

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "GET /api/debates/[slug]/comments/by-side error:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
