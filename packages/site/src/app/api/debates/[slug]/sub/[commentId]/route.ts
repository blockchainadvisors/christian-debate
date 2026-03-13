import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { promotedComments, comments, users, debates } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; commentId: string }> }
) {
  try {
    const { slug, commentId } = await params;

    // Find debate
    const [debate] = await db
      .select({
        id: debates.id,
        slug: debates.slug,
        title: debates.title,
        sideALabel: debates.sideALabel,
        sideBLabel: debates.sideBLabel,
      })
      .from(debates)
      .where(eq(debates.slug, slug))
      .limit(1);

    if (!debate) {
      return NextResponse.json({ error: "Debate not found" }, { status: 404 });
    }

    // Check if comment is promoted
    const [promoted] = await db
      .select()
      .from(promotedComments)
      .where(
        and(
          eq(promotedComments.commentId, commentId),
          eq(promotedComments.debateId, debate.id)
        )
      )
      .limit(1);

    if (!promoted) {
      return NextResponse.json(
        { error: "Comment is not promoted" },
        { status: 404 }
      );
    }

    // Fetch thesis comment with author
    const [thesis] = await db
      .select({
        id: comments.id,
        content: comments.content,
        stanceSide: comments.stanceSide,
        score: comments.score,
        createdAt: comments.createdAt,
        authorDisplayName: users.displayName,
        authorUsername: users.username,
        authorAvatarUrl: users.avatarUrl,
        authorId: comments.authorId,
      })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.id, commentId))
      .limit(1);

    if (!thesis) {
      return NextResponse.json(
        { error: "Thesis comment not found" },
        { status: 404 }
      );
    }

    // Fetch all descendants using ancestorPath array contains
    const descendants = await db
      .select({
        id: comments.id,
        parentId: comments.parentId,
        content: comments.content,
        stanceSide: comments.stanceSide,
        score: comments.score,
        createdAt: comments.createdAt,
        status: comments.status,
        authorDisplayName: users.displayName,
        authorUsername: users.username,
        authorAvatarUrl: users.avatarUrl,
        authorId: comments.authorId,
      })
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(
        and(
          eq(comments.debateId, debate.id),
          sql`${commentId} = ANY(${comments.ancestorPath})`
        )
      )
      .orderBy(comments.createdAt);

    // Categorize by stance relative to thesis
    const thesisStance = thesis.stanceSide;
    const supporting = descendants.filter(
      (d) => d.stanceSide === thesisStance && d.status === "active"
    );
    const refuting = descendants.filter(
      (d) =>
        d.status === "active" &&
        ((thesisStance === "side_a" && d.stanceSide === "side_b") ||
          (thesisStance === "side_b" && d.stanceSide === "side_a"))
    );
    const neutral = descendants.filter(
      (d) =>
        d.status === "active" &&
        !supporting.includes(d) &&
        !refuting.includes(d)
    );

    const formatComment = (c: (typeof descendants)[number]) => ({
      id: c.id,
      parentId: c.parentId,
      content: c.content,
      stanceSide: c.stanceSide,
      score: c.score,
      createdAt: c.createdAt.toISOString(),
      author: {
        id: c.authorId,
        displayName: c.authorDisplayName,
        username: c.authorUsername,
        avatarUrl: c.authorAvatarUrl,
      },
    });

    return NextResponse.json({
      thesis: {
        id: thesis.id,
        content: thesis.content,
        stanceSide: thesis.stanceSide,
        score: thesis.score,
        createdAt: thesis.createdAt.toISOString(),
        promotedAt: promoted.promotedAt.toISOString(),
        author: {
          id: thesis.authorId,
          displayName: thesis.authorDisplayName,
          username: thesis.authorUsername,
          avatarUrl: thesis.authorAvatarUrl,
        },
      },
      debate: {
        slug: debate.slug,
        title: debate.title,
        sideALabel: debate.sideALabel,
        sideBLabel: debate.sideBLabel,
      },
      supporting: supporting.map(formatComment),
      refuting: refuting.map(formatComment),
      neutral: neutral.map(formatComment),
    });
  } catch (error) {
    console.error("GET /api/debates/[slug]/sub/[commentId] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
