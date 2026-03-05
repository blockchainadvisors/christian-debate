import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { surveys, surveyQuestions } from "@/db/survey-schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

// GET /api/surveys/[id] — Return survey with all questions
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [survey] = await db
      .select()
      .from(surveys)
      .where(eq(surveys.id, id))
      .limit(1);

    if (!survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    const questions = await db
      .select()
      .from(surveyQuestions)
      .where(eq(surveyQuestions.surveyId, id))
      .orderBy(surveyQuestions.orderIndex);

    return NextResponse.json({ survey: { ...survey, questions } });
  } catch (error) {
    console.error("Failed to get survey:", error);
    return NextResponse.json(
      { error: "Failed to get survey" },
      { status: 500 }
    );
  }
}

// PATCH /api/surveys/[id] — Update survey status (moderator+ only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select({ trustTier: users.trustTier })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user || !["moderator", "admin"].includes(user.trustTier)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !["draft", "active", "closed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be draft, active, or closed." },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(surveys)
      .where(eq(surveys.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    // Validate transitions: draft -> active -> closed
    const validTransitions: Record<string, string[]> = {
      draft: ["active"],
      active: ["closed"],
      closed: [],
    };

    if (!validTransitions[existing.status]?.includes(status)) {
      return NextResponse.json(
        {
          error: `Cannot transition from '${existing.status}' to '${status}'. Allowed: ${validTransitions[existing.status]?.join(", ") || "none"}`,
        },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { status };
    if (status === "closed") {
      updateData.closedAt = new Date();
    }

    const [updated] = await db
      .update(surveys)
      .set(updateData)
      .where(eq(surveys.id, id))
      .returning();

    return NextResponse.json({ survey: updated });
  } catch (error) {
    console.error("Failed to update survey:", error);
    return NextResponse.json(
      { error: "Failed to update survey" },
      { status: 500 }
    );
  }
}
