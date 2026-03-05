import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  surveys,
  surveyQuestions,
  surveyResponses,
  surveyAnswers,
} from "@/db/survey-schema";
import { redis } from "@/lib/redis";
import { eq, sql } from "drizzle-orm";
import type { SurveyResults } from "@/types/surveys";

// GET /api/surveys/[id]/results — Aggregated results, cached 120s
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: surveyId } = await params;

    // Check Redis cache
    const cacheKey = `survey:results:${surveyId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached));
    }

    // Get survey
    const [survey] = await db
      .select()
      .from(surveys)
      .where(eq(surveys.id, surveyId))
      .limit(1);

    if (!survey) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 });
    }

    // Get questions
    const questions = await db
      .select()
      .from(surveyQuestions)
      .where(eq(surveyQuestions.surveyId, surveyId))
      .orderBy(surveyQuestions.orderIndex);

    // Get total response count
    const [{ count: totalResponses }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(surveyResponses)
      .where(eq(surveyResponses.surveyId, surveyId));

    // Get answer distributions for each question
    const questionResults = await Promise.all(
      questions.map(async (q) => {
        const distribution = await db
          .select({
            answer: surveyAnswers.answerValue,
            count: sql<number>`count(*)::int`,
          })
          .from(surveyAnswers)
          .where(eq(surveyAnswers.questionId, q.id))
          .groupBy(surveyAnswers.answerValue)
          .orderBy(sql`count(*) desc`);

        return {
          questionId: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          answerDistribution: distribution.map((d) => ({
            answer: d.answer,
            count: d.count,
          })),
          totalResponses: distribution.reduce((sum, d) => sum + d.count, 0),
        };
      })
    );

    const results: SurveyResults = {
      surveyId,
      title: survey.title,
      totalResponses,
      questions: questionResults,
    };

    // Cache for 120 seconds
    await redis.set(cacheKey, JSON.stringify(results), "EX", 120);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Failed to get survey results:", error);
    return NextResponse.json(
      { error: "Failed to get results" },
      { status: 500 }
    );
  }
}
