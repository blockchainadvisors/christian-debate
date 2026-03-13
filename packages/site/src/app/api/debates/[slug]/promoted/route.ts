import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { promotedComments, debates } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const [debate] = await db
      .select({ id: debates.id })
      .from(debates)
      .where(eq(debates.slug, slug))
      .limit(1);

    if (!debate) {
      return NextResponse.json({ error: "Debate not found" }, { status: 404 });
    }

    const rows = await db
      .select({ commentId: promotedComments.commentId })
      .from(promotedComments)
      .where(eq(promotedComments.debateId, debate.id));

    return NextResponse.json(rows.map((r) => r.commentId));
  } catch (error) {
    console.error("GET /api/debates/[slug]/promoted error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
