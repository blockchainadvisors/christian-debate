import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { comments, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

function formatComment(row: {
  id: string;
  debateId: string;
  authorId: string;
  parentId: string | null;
  rootId: string | null;
  depth: number;
  content: string;
  stanceSide: string;
  ancestorPath: string[] | null;
  isQuarantined: boolean;
  quarantineReason: string | null;
  status: string;
  score: number;
  createdAt: Date;
  editedAt: Date | null;
  authorDisplayName: string;
  authorUsername: string;
  authorAvatarUrl: string | null;
}) {
  return {
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
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [row] = await db
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

    if (!row) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(formatComment(row));
  } catch (error) {
    console.error("GET /api/comments/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get existing comment
    const [existing] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    if (existing.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the author can edit this comment" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim().length < 1) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(comments)
      .set({
        content: content.trim(),
        editedAt: new Date(),
        status: "edited",
      })
      .where(eq(comments.id, id))
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

    return NextResponse.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      editedAt: updated.editedAt?.toISOString() ?? null,
      author,
    });
  } catch (error) {
    console.error("PATCH /api/comments/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [existing] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    if (existing.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the author can delete this comment" },
        { status: 403 }
      );
    }

    await db
      .update(comments)
      .set({ status: "deleted_by_author" })
      .where(eq(comments.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/comments/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
