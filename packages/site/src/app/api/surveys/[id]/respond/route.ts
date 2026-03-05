import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  surveys,
  surveyQuestions,
  surveyResponses,
  surveyAnswers,
} from "@/db/survey-schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// POST /api/surveys/[id]/respond — Submit survey response
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: surveyId } = await params;
    const body = await request.json();
    const { answers } = body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: "Answers array is required" },
        { status: 400 }
      );
    }

    // Check survey exists and is active
    const [survey] = await db
      .select()
      .from(surveys)
      .where(eq(surveys.id, surveyId))
      .limit(1);

    if (!survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    if (survey.status !== "active") {
      return NextResponse.json(
        { error: "Survey is not currently accepting responses" },
        { status: 400 }
      );
    }

    // Check if user already responded
    const [existingResponse] = await db
      .select()
      .from(surveyResponses)
      .where(
        and(
          eq(surveyResponses.surveyId, surveyId),
          eq(surveyResponses.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingResponse) {
      return NextResponse.json(
        { error: "You have already responded to this survey" },
        { status: 409 }
      );
    }

    // Get questions for validation
    const questions = await db
      .select()
      .from(surveyQuestions)
      .where(eq(surveyQuestions.surveyId, surveyId));

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    // Validate required questions are answered
    const answeredQuestionIds = new Set(
      answers.map((a: { questionId: string }) => a.questionId)
    );
    for (const q of questions) {
      if (q.required && !answeredQuestionIds.has(q.id)) {
        return NextResponse.json(
          { error: `Required question "${q.questionText}" is not answered` },
          { status: 400 }
        );
      }
    }

    // Validate answer question IDs exist
    for (const a of answers) {
      if (!questionMap.has(a.questionId)) {
        return NextResponse.json(
          { error: `Unknown question ID: ${a.questionId}` },
          { status: 400 }
        );
      }
      if (typeof a.answerValue !== "string" || a.answerValue.trim() === "") {
        return NextResponse.json(
          { error: "Each answer must have a non-empty answerValue string" },
          { status: 400 }
        );
      }
    }

    // Create response and answers
    const [response] = await db
      .insert(surveyResponses)
      .values({
        surveyId,
        userId: session.user.id,
      })
      .returning();

    const answerRows = answers.map(
      (a: { questionId: string; answerValue: string }) => ({
        responseId: response.id,
        questionId: a.questionId,
        answerValue: a.answerValue,
      })
    );

    await db.insert(surveyAnswers).values(answerRows);

    return NextResponse.json(
      { response: { id: response.id, submittedAt: response.submittedAt } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to submit survey response:", error);
    return NextResponse.json(
      { error: "Failed to submit response" },
      { status: 500 }
    );
  }
}
