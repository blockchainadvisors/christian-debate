"use client";

import type { SurveyResults } from "@/types/surveys";

interface SurveyResultsViewProps {
  results: SurveyResults;
}

export function SurveyResultsView({ results }: SurveyResultsViewProps) {
  return (
    <div style={{ maxWidth: 720 }}>
      <h2>{results.title} - Results</h2>
      <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
        Total responses: {results.totalResponses}
      </p>

      {results.questions.map((q) => {
        const maxCount = Math.max(
          ...q.answerDistribution.map((d) => d.count),
          1
        );

        return (
          <div
            key={q.questionId}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "1rem 1.25rem",
              marginBottom: "1rem",
            }}
          >
            <h3 style={{ marginBottom: 12, fontSize: "1rem" }}>
              {q.questionText}
            </h3>
            <p style={{ fontSize: "0.8rem", color: "#9ca3af", marginBottom: 8 }}>
              {q.totalResponses} responses
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {q.answerDistribution.map((d) => {
                const pct =
                  q.totalResponses > 0
                    ? Math.round((d.count / q.totalResponses) * 100)
                    : 0;
                const barWidth = (d.count / maxCount) * 100;

                return (
                  <div key={d.answer}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.85rem",
                        marginBottom: 2,
                      }}
                    >
                      <span>{d.answer}</span>
                      <span style={{ color: "#6b7280" }}>
                        {d.count} ({pct}%)
                      </span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: 20,
                        backgroundColor: "#f3f4f6",
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${barWidth}%`,
                          height: "100%",
                          backgroundColor: "#3b82f6",
                          borderRadius: 4,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
