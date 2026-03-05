import { NextRequest, NextResponse } from "next/server";
import { verifyHubRequest } from "@/lib/federation-auth";
import { db } from "@/db";
import { comments, debates } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyHubRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: localUserId } = await params;

  const topComments = await db
    .select({
      debateTitle: debates.title,
      debateSlug: debates.slug,
      content: comments.content,
      score: comments.score,
      stanceSide: comments.stanceSide,
      createdAt: comments.createdAt,
    })
    .from(comments)
    .innerJoin(debates, eq(comments.debateId, debates.id))
    .where(eq(comments.authorId, localUserId))
    .orderBy(desc(comments.score))
    .limit(5);

  const highlights = topComments.map((c) => ({
    debateTitle: c.debateTitle,
    debateSlug: c.debateSlug,
    content: c.content.length > 200 ? c.content.slice(0, 200) + "..." : c.content,
    score: c.score,
    stanceSide: c.stanceSide,
    createdAt: c.createdAt,
  }));

  return NextResponse.json({ highlights });
}
