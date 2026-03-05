import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { comments, users } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check moderator/admin
  const [user] = await db
    .select({ trustTier: users.trustTier })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user || (user.trustTier !== "moderator" && user.trustTier !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: commentId } = await params;

  const body = await request.json();
  const { action } = body as { action: "approve" | "remove" };

  if (action !== "approve" && action !== "remove") {
    return NextResponse.json(
      { error: "Invalid action. Must be 'approve' or 'remove'." },
      { status: 400 }
    );
  }

  // Check comment exists
  const [existing] = await db
    .select({ id: comments.id })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  if (action === "approve") {
    await db
      .update(comments)
      .set({
        isQuarantined: false,
        quarantineReason: null,
      })
      .where(eq(comments.id, commentId));
  } else {
    // remove
    await db
      .update(comments)
      .set({
        status: "removed_by_mod",
      })
      .where(eq(comments.id, commentId));
  }

  // Return updated comment
  const [updated] = await db
    .select()
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

  return NextResponse.json({ comment: updated });
}
