import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { argumentTags } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; taxonomy: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { id: commentId, taxonomy } = await params;

  // Find the tag created by this user
  const [existing] = await db
    .select({ id: argumentTags.id })
    .from(argumentTags)
    .where(
      and(
        eq(argumentTags.commentId, commentId),
        eq(argumentTags.taxonomy, taxonomy as any),
        eq(argumentTags.taggedBy, userId)
      )
    )
    .limit(1);

  if (!existing) {
    return NextResponse.json(
      { error: "Tag not found or you are not the creator" },
      { status: 404 }
    );
  }

  await db.delete(argumentTags).where(eq(argumentTags.id, existing.id));

  return NextResponse.json({ deleted: true });
}
