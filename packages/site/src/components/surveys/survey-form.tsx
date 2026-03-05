"use client";

import { useState } from "react";
import type { SurveyWithQuestions } from "@/types/surveys";

interface SurveyFormProps {
  survey: SurveyWithQuestions;
  onSubmitted?: () => void;
}

export function SurveyForm({ survey, onSubmitted }: SurveyFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const setAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required questions
    for (const q of survey.questions) {
      if (q.required && !answers[q.id]?.trim()) {
        setError(`Please answer: "${q.questionText}"`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/surveys/${survey.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: Object.entries(answers)
            .filter(([, v]) => v.trim() !== "")
            .map(([questionId, answerValue]) => ({
              questionId,
              answerValue,
            })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }

      setSubmitted(true);
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h3>Thank you for your response!</h3>
        <p>Your answers have been recorded.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
      <h2>{survey.title}</h2>
      {survey.description && (
        <p style={{ color: "#666", marginBottom: "1.5rem" }}>
          {survey.description}
        </p>
      )}

      {error && (
        <div
          style={{
            padding: "0.75rem 1rem",
            backgroundColor: "#fef2f2",
            color: "#dc2626",
            borderRadius: 6,
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      {survey.questions.map((q) => (
        <fieldset
          key={q.id}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: "1rem 1.25rem",
            marginBottom: "1rem",
          }}
        >
          <legend style={{ fontWeight: 600 }}>
            {q.questionText}
            {q.required && <span style={{ color: "#dc2626" }}> *</span>}
          </legend>

          {q.questionType === "multiple_choice" && q.options && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {q.options.map((option) => (
                <label key={option} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="radio"
                    name={q.id}
                    value={option}
                    checked={answers[q.id] === option}
                    onChange={() => setAnswer(q.id, option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          )}

          {q.questionType === "yes_no" && (
            <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
              {["Yes", "No"].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAnswer(q.id, val)}
                  style={{
                    padding: "0.5rem 1.5rem",
                    borderRadius: 6,
                    border: "1px solid #d1d5db",
                    backgroundColor:
                      answers[q.id] === val ? "#3b82f6" : "#fff",
                    color: answers[q.id] === val ? "#fff" : "#374151",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  {val}
                </button>
              ))}
            </div>
          )}

          {q.questionType === "likert_scale" && (
            <div style={{ marginTop: 8 }}>
              <input
                type="range"
                min="1"
                max="5"
                value={answers[q.id] || "3"}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                style={{ width: "100%" }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.8rem",
                  color: "#6b7280",
                }}
              >
                <span>Strongly Disagree</span>
                <span>Neutral</span>
                <span>Strongly Agree</span>
              </div>
              <div style={{ textAlign: "center", fontWeight: 600, marginTop: 4 }}>
                {answers[q.id] || "3"}
              </div>
            </div>
          )}

          {q.questionType === "free_text" && (
            <textarea
              value={answers[q.id] || ""}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              rows={4}
              style={{
                width: "100%",
                marginTop: 8,
                padding: "0.5rem",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                resize: "vertical",
              }}
              placeholder="Enter your response..."
            />
          )}
        </fieldset>
      ))}

      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: "0.75rem 2rem",
          backgroundColor: submitting ? "#9ca3af" : "#3b82f6",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: submitting ? "not-allowed" : "pointer",
          fontWeight: 600,
          fontSize: "1rem",
        }}
      >
        {submitting ? "Submitting..." : "Submit Survey"}
      </button>
    </form>
  );
}
