import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { burdenOfProofRequests, votes, comments } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

// GET: Return the burden of proof request for this comment (if any), or null.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: commentId } = await params;

  const [burdenRequest] = await db
    .select()
    .from(burdenOfProofRequests)
    .where(eq(burdenOfProofRequests.commentId, commentId))
    .limit(1);

  return NextResponse.json(burdenRequest ?? null);
}

// POST: Called automatically when a comment accumulates 3+ misleading_unsourced downvotes.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: commentId } = await params;

  // Count misleading_unsourced votes for this comment
  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(votes)
    .where(
      and(
        eq(votes.commentId, commentId),
        eq(votes.reason, "misleading_unsourced")
      )
    );

  if (!countResult || countResult.count < 3) {
    return NextResponse.json(
      { error: "Not enough misleading_unsourced votes" },
      { status: 400 }
    );
  }

  // Check if a burden request already exists
  const [existing] = await db
    .select()
    .from(burdenOfProofRequests)
    .where(eq(burdenOfProofRequests.commentId, commentId))
    .limit(1);

  if (existing) {
    return NextResponse.json(existing);
  }

  // Create the burden of proof request
  const [created] = await db
    .insert(burdenOfProofRequests)
    .values({
      commentId,
      flagCount: countResult.count,
      status: "pending",
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}

// PATCH: For the comment author to provide a citation.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: commentId } = await params;

  // Verify the current user is the comment author
  const [comment] = await db
    .select({ authorId: comments.authorId })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  if (comment.authorId !== session.user.id) {
    return NextResponse.json(
      { error: "Only the comment author can provide a citation" },
      { status: 403 }
    );
  }

  // Parse and validate the citation URL
  const body = await request.json();
  const { citationUrl } = body;

  if (!citationUrl || typeof citationUrl !== "string" || !citationUrl.trim()) {
    return NextResponse.json(
      { error: "citationUrl is required and must be a non-empty string" },
      { status: 400 }
    );
  }

  // Check that a burden request exists
  const [burdenRequest] = await db
    .select()
    .from(burdenOfProofRequests)
    .where(eq(burdenOfProofRequests.commentId, commentId))
    .limit(1);

  if (!burdenRequest) {
    return NextResponse.json(
      { error: "No burden of proof request found for this comment" },
      { status: 404 }
    );
  }

  // Update the burden request
  const [updated] = await db
    .update(burdenOfProofRequests)
    .set({
      citationUrl: citationUrl.trim(),
      status: "citation_provided",
    })
    .where(eq(burdenOfProofRequests.commentId, commentId))
    .returning();

  return NextResponse.json(updated);
}
