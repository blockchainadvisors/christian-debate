"use client";

import type { CorrelationData } from "@/types/surveys";

interface CorrelationViewerProps {
  correlations: CorrelationData;
}

const STANCE_COLORS = {
  sideA: "#ef4444",
  sideB: "#3b82f6",
  neutral: "#9ca3af",
};

const STYLE_COLORS: Record<string, string> = {
  empirical: "#10b981",
  moral_ethical: "#8b5cf6",
  economic: "#f59e0b",
  procedural: "#6366f1",
  anecdotal: "#ec4899",
  legal: "#14b8a6",
  historical: "#f97316",
  none: "#d1d5db",
};

export function CorrelationViewer({ correlations }: CorrelationViewerProps) {
  return (
    <div style={{ maxWidth: 800 }}>
      <h2>{correlations.title} - Correlations</h2>
      <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
        Cross-reference of survey answers with debate behavior and engagement
        patterns
      </p>

      {correlations.correlations.map((q) => (
        <div
          key={q.questionId}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: "1.25rem",
            marginBottom: "1.25rem",
          }}
        >
          <h3 style={{ marginBottom: 16, fontSize: "1rem" }}>
            {q.questionText}
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {q.answerBreakdown.map((ab) => {
              const totalStance =
                ab.stanceDistribution.sideA +
                ab.stanceDistribution.sideB +
                ab.stanceDistribution.neutral;

              return (
                <div
                  key={ab.answer}
                  style={{
                    backgroundColor: "#f9fafb",
                    borderRadius: 6,
                    padding: "1rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{ab.answer}</span>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "#6b7280",
                        backgroundColor: "#e5e7eb",
                        padding: "2px 8px",
                        borderRadius: 12,
                      }}
                    >
                      {ab.count} respondents
                    </span>
                  </div>

                  {/* Metrics row */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    {/* Average Stance */}
                    <div
                      style={{
                        textAlign: "center",
                        padding: "0.5rem",
                        backgroundColor: "#fff",
                        borderRadius: 6,
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "#9ca3af",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Avg Stance
                      </div>
                      <div
                        style={{
                          fontSize: "1.1rem",
                          fontWeight: 700,
                          color:
                            ab.avgStance < -0.2
                              ? STANCE_COLORS.sideA
                              : ab.avgStance > 0.2
                                ? STANCE_COLORS.sideB
                                : STANCE_COLORS.neutral,
                        }}
                      >
                        {ab.avgStance > 0 ? "+" : ""}
                        {ab.avgStance.toFixed(2)}
                      </div>
                    </div>

                    {/* Persuasion Score */}
                    <div
                      style={{
                        textAlign: "center",
                        padding: "0.5rem",
                        backgroundColor: "#fff",
                        borderRadius: 6,
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "#9ca3af",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Avg Persuasion
                      </div>
                      <div
                        style={{ fontSize: "1.1rem", fontWeight: 700 }}
                      >
                        {ab.avgPersuasion.toFixed(1)}
                      </div>
                    </div>

                    {/* Dominant Style */}
                    <div
                      style={{
                        textAlign: "center",
                        padding: "0.5rem",
                        backgroundColor: "#fff",
                        borderRadius: 6,
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "#9ca3af",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Dominant Style
                      </div>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          color:
                            STYLE_COLORS[ab.dominantArgumentStyle] ?? "#374151",
                        }}
                      >
                        {ab.dominantArgumentStyle.replace(/_/g, " ")}
                      </div>
                    </div>
                  </div>

                  {/* Stance Distribution Bar */}
                  {totalStance > 0 && (
                    <div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#6b7280",
                          marginBottom: 4,
                        }}
                      >
                        Stance Distribution
                      </div>
                      <div
                        style={{
                          display: "flex",
                          height: 16,
                          borderRadius: 4,
                          overflow: "hidden",
                        }}
                      >
                        {ab.stanceDistribution.sideA > 0 && (
                          <div
                            style={{
                              width: `${(ab.stanceDistribution.sideA / totalStance) * 100}%`,
                              backgroundColor: STANCE_COLORS.sideA,
                            }}
                            title={`Side A: ${ab.stanceDistribution.sideA}`}
                          />
                        )}
                        {ab.stanceDistribution.neutral > 0 && (
                          <div
                            style={{
                              width: `${(ab.stanceDistribution.neutral / totalStance) * 100}%`,
                              backgroundColor: STANCE_COLORS.neutral,
                            }}
                            title={`Neutral: ${ab.stanceDistribution.neutral}`}
                          />
                        )}
                        {ab.stanceDistribution.sideB > 0 && (
                          <div
                            style={{
                              width: `${(ab.stanceDistribution.sideB / totalStance) * 100}%`,
                              backgroundColor: STANCE_COLORS.sideB,
                            }}
                            title={`Side B: ${ab.stanceDistribution.sideB}`}
                          />
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.7rem",
                          color: "#9ca3af",
                          marginTop: 2,
                        }}
                      >
                        <span>
                          Side A: {ab.stanceDistribution.sideA}
                        </span>
                        <span>
                          Neutral: {ab.stanceDistribution.neutral}
                        </span>
                        <span>
                          Side B: {ab.stanceDistribution.sideB}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
