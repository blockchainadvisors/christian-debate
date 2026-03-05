import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  surveys,
  surveyQuestions,
} from "@/db/survey-schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// GET /api/surveys — List active surveys, optional ?debateId= filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const debateId = searchParams.get("debateId");

    const conditions = [eq(surveys.status, "active")];
    if (debateId) {
      conditions.push(eq(surveys.debateId, debateId));
    }

    const results = await db
      .select()
      .from(surveys)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(surveys.createdAt);

    return NextResponse.json({ surveys: results });
  } catch (error) {
    console.error("Failed to list surveys:", error);
    return NextResponse.json(
      { error: "Failed to list surveys" },
      { status: 500 }
    );
  }
}

// POST /api/surveys — Create a survey with questions (moderator+ only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check trust tier
    const [user] = await db
      .select({ trustTier: users.trustTier })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user || !["moderator", "admin"].includes(user.trustTier)) {
      return NextResponse.json(
        { error: "Insufficient permissions. Moderator or higher required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, debateId, questions } = body;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Title and at least one question are required" },
        { status: 400 }
      );
    }

    // Validate questions
    const validTypes = ["multiple_choice", "likert_scale", "free_text", "yes_no"];
    for (const q of questions) {
      if (!q.questionText || !q.questionType || !validTypes.includes(q.questionType)) {
        return NextResponse.json(
          { error: "Each question must have questionText and a valid questionType" },
          { status: 400 }
        );
      }
      if (q.questionType === "multiple_choice" && (!q.options || !Array.isArray(q.options) || q.options.length < 2)) {
        return NextResponse.json(
          { error: "Multiple choice questions must have at least 2 options" },
          { status: 400 }
        );
      }
    }

    // Create survey
    const [survey] = await db
      .insert(surveys)
      .values({
        title,
        description: description ?? null,
        debateId: debateId ?? null,
        createdBy: session.user.id,
      })
      .returning();

    // Create questions
    const questionRows = questions.map(
      (q: { questionText: string; questionType: string; options?: string[]; required?: boolean }, idx: number) => ({
        surveyId: survey.id,
        questionText: q.questionText,
        questionType: q.questionType as "multiple_choice" | "likert_scale" | "free_text" | "yes_no",
        options: q.options ?? null,
        orderIndex: idx,
        required: q.required ?? true,
      })
    );

    const createdQuestions = await db
      .insert(surveyQuestions)
      .values(questionRows)
      .returning();

    return NextResponse.json(
      { survey: { ...survey, questions: createdQuestions } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create survey:", error);
    return NextResponse.json(
      { error: "Failed to create survey" },
      { status: 500 }
    );
  }
}
