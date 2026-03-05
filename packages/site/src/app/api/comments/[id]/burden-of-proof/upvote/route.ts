import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { burdenOfProofRequests } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

// POST: Upvote the provided citation as credible
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: commentId } = await params;

  // Check that a burden request exists and has a citation
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

  if (!burdenRequest.citationUrl) {
    return NextResponse.json(
      { error: "No citation has been provided yet" },
      { status: 400 }
    );
  }

  const newUpvoteCount = burdenRequest.citationUpvotes + 1;

  // If upvotes reach 3+, set status to upheld
  const updateData: {
    citationUpvotes: number;
    status?: "upheld";
    resolvedAt?: Date;
  } = {
    citationUpvotes: newUpvoteCount,
  };

  if (newUpvoteCount >= 3) {
    updateData.status = "upheld";
    updateData.resolvedAt = new Date();
  }

  const [updated] = await db
    .update(burdenOfProofRequests)
    .set(updateData)
    .where(eq(burdenOfProofRequests.commentId, commentId))
    .returning();

  return NextResponse.json(updated);
}
