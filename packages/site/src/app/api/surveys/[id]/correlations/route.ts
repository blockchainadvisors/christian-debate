import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, debateStances } from "@/db/schema";
import {
  surveys,
  surveyQuestions,
  surveyResponses,
  surveyAnswers,
} from "@/db/survey-schema";
import { redis } from "@/lib/redis";
import { eq, and, sql } from "drizzle-orm";
import type { EngagementFingerprint } from "@/types/engagement";
import type { CorrelationData, QuestionCorrelation } from "@/types/surveys";

// GET /api/surveys/[id]/correlations — Correlation engine
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: surveyId } = await params;

    // Check Redis cache
    const cacheKey = `survey:correlations:${surveyId}`;
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

    // Get all responses with user data and answers
    const responsesWithUsers = await db
      .select({
        responseId: surveyResponses.id,
        userId: surveyResponses.userId,
        engagementFingerprint: users.engagementFingerprint,
      })
      .from(surveyResponses)
      .innerJoin(users, eq(surveyResponses.userId, users.id))
      .where(eq(surveyResponses.surveyId, surveyId));

    // Get all answers for this survey
    const allAnswers = await db
      .select({
        responseId: surveyAnswers.responseId,
        questionId: surveyAnswers.questionId,
        answerValue: surveyAnswers.answerValue,
      })
      .from(surveyAnswers)
      .innerJoin(
        surveyResponses,
        eq(surveyAnswers.responseId, surveyResponses.id)
      )
      .where(eq(surveyResponses.surveyId, surveyId));

    // Get stance distributions if debate-linked
    let stancesByUser: Map<string, string> | null = null;
    if (survey.debateId) {
      const stances = await db
        .select({
          userId: debateStances.userId,
          declaredStance: debateStances.declaredStance,
        })
        .from(debateStances)
        .where(eq(debateStances.debateId, survey.debateId));

      stancesByUser = new Map(
        stances.map((s) => [s.userId, s.declaredStance])
      );
    }

    // Build user data map
    const userDataMap = new Map(
      responsesWithUsers.map((r) => [
        r.responseId,
        {
          userId: r.userId,
          fingerprint: r.engagementFingerprint as EngagementFingerprint | null,
        },
      ])
    );

    // Build answer map: questionId -> { answerValue -> responseIds[] }
    const answersByQuestion = new Map<
      string,
      Map<string, string[]>
    >();
    for (const a of allAnswers) {
      if (!answersByQuestion.has(a.questionId)) {
        answersByQuestion.set(a.questionId, new Map());
      }
      const answerMap = answersByQuestion.get(a.questionId)!;
      if (!answerMap.has(a.answerValue)) {
        answerMap.set(a.answerValue, []);
      }
      answerMap.get(a.answerValue)!.push(a.responseId);
    }

    // Compute correlations per question
    const correlations: QuestionCorrelation[] = questions.map((q) => {
      const answerMap = answersByQuestion.get(q.id) ?? new Map();

      const answerBreakdown = Array.from(answerMap.entries()).map(
        ([answer, responseIds]) => {
          const fingerprints: EngagementFingerprint[] = [];
          const stanceCounts = { sideA: 0, sideB: 0, neutral: 0 };

          for (const responseId of responseIds) {
            const userData = userDataMap.get(responseId);
            if (!userData) continue;

            if (userData.fingerprint) {
              fingerprints.push(userData.fingerprint);
            }

            if (stancesByUser) {
              const stance = stancesByUser.get(userData.userId);
              if (stance === "side_a") stanceCounts.sideA++;
              else if (stance === "side_b") stanceCounts.sideB++;
              else stanceCounts.neutral++;
            }
          }

          // Compute averages from fingerprints
          const avgStance =
            fingerprints.length > 0
              ? fingerprints.reduce((s, f) => s + f.avgStance, 0) /
                fingerprints.length
              : 0;

          const avgPersuasion =
            fingerprints.length > 0
              ? fingerprints.reduce((s, f) => s + f.persuasionScore, 0) /
                fingerprints.length
              : 0;

          // Determine dominant argument style
          let dominantArgumentStyle = "none";
          if (fingerprints.length > 0) {
            const styleTotals: Record<string, number> = {};
            for (const f of fingerprints) {
              for (const [style, weight] of Object.entries(
                f.argumentStyleWeights
              )) {
                styleTotals[style] = (styleTotals[style] ?? 0) + weight;
              }
            }
            let maxWeight = 0;
            for (const [style, total] of Object.entries(styleTotals)) {
              if (total > maxWeight) {
                maxWeight = total;
                dominantArgumentStyle = style;
              }
            }
          }

          return {
            answer,
            count: responseIds.length,
            avgStance: Math.round(avgStance * 1000) / 1000,
            avgPersuasion: Math.round(avgPersuasion * 100) / 100,
            dominantArgumentStyle,
            stanceDistribution: stanceCounts,
          };
        }
      );

      return {
        questionId: q.id,
        questionText: q.questionText,
        answerBreakdown,
      };
    });

    const result: CorrelationData = {
      surveyId,
      title: survey.title,
      correlations,
    };

    // Cache for 120 seconds
    await redis.set(cacheKey, JSON.stringify(result), "EX", 120);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to compute correlations:", error);
    return NextResponse.json(
      { error: "Failed to compute correlations" },
      { status: 500 }
    );
  }
}
