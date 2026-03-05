import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { comments, users } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch the comment
    const [commentRow] = await db
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
      .where(eq(comments.id, id))
      .limit(1);

    if (!commentRow) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    const formatRow = (row: typeof commentRow) => ({
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

    // Fetch ancestors if there are any
    let ancestors: ReturnType<typeof formatRow>[] = [];

    if (commentRow.ancestorPath && commentRow.ancestorPath.length > 0) {
      const ancestorRows = await db
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
        .where(inArray(comments.id, commentRow.ancestorPath));

      // Order ancestors from root to leaf based on ancestorPath order
      const ancestorMap = new Map(ancestorRows.map((r) => [r.id, r]));
      ancestors = commentRow.ancestorPath
        .map((aid) => ancestorMap.get(aid))
        .filter(Boolean)
        .map((r) => formatRow(r!));
    }

    return NextResponse.json({
      comment: formatRow(commentRow),
      ancestors,
    });
  } catch (error) {
    console.error("GET /api/comments/[id]/context error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
