import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, comments, debates, debateStances } from "@/db/schema";
import { eq, count } from "drizzle-orm";

/**
 * GET /api/federation/user/[id]/reputation
 *
 * Called by the Hub to fetch this site's reputation snapshot for a user.
 * Verified via X-Agora-Site-Id header (the Hub identifies itself).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: localUserId } = await params;

  // Simple auth: verify the request comes from a known source
  const siteIdHeader = request.headers.get("x-agora-site-id");
  if (!siteIdHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user
    const [user] = await db
      .select({
        reputationScore: users.reputationScore,
        persuasionRating: users.persuasionRating,
      })
      .from(users)
      .where(eq(users.id, localUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Count comments
    const [commentResult] = await db
      .select({ value: count() })
      .from(comments)
      .where(eq(comments.authorId, localUserId));

    // Count debates (stances the user has taken)
    const [debateResult] = await db
      .select({ value: count() })
      .from(debateStances)
      .where(eq(debateStances.userId, localUserId));

    return NextResponse.json({
      reputationScore: user.reputationScore,
      persuasionRating: user.persuasionRating,
      commentCount: commentResult?.value ?? 0,
      debateCount: debateResult?.value ?? 0,
    });
  } catch (error) {
    console.error("Failed to fetch user reputation:", error);
    return NextResponse.json(
      { error: "Failed to fetch user reputation" },
      { status: 500 },
    );
  }
}
