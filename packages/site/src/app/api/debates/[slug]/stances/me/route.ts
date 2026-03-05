import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { debateStances, debates } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const stance = await db
    .select()
    .from(debateStances)
    .where(
      and(
        eq(debateStances.debateId, debate.id),
        eq(debateStances.userId, session.user.id)
      )
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  return NextResponse.json(stance);
}
