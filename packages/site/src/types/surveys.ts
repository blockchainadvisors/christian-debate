export interface Survey {
  id: string;
  debateId: string | null;
  title: string;
  description: string | null;
  createdBy: string;
  status: "draft" | "active" | "closed";
  createdAt: string;
  closedAt: string | null;
}

export interface SurveyQuestion {
  id: string;
  surveyId: string;
  questionText: string;
  questionType: "multiple_choice" | "likert_scale" | "free_text" | "yes_no";
  options: string[] | null;
  orderIndex: number;
  required: boolean;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  userId: string;
  submittedAt: string;
}

export interface SurveyAnswer {
  id: string;
  responseId: string;
  questionId: string;
  answerValue: string;
  createdAt: string;
}

export interface SurveyWithQuestions extends Survey {
  questions: SurveyQuestion[];
}

export interface QuestionResult {
  questionId: string;
  questionText: string;
  questionType: SurveyQuestion["questionType"];
  answerDistribution: { answer: string; count: number }[];
  totalResponses: number;
}

export interface SurveyResults {
  surveyId: string;
  title: string;
  totalResponses: number;
  questions: QuestionResult[];
}

export interface AnswerCorrelation {
  answer: string;
  count: number;
  avgStance: number;
  avgPersuasion: number;
  dominantArgumentStyle: string;
  stanceDistribution: {
    sideA: number;
    sideB: number;
    neutral: number;
  };
}

export interface QuestionCorrelation {
  questionId: string;
  questionText: string;
  answerBreakdown: AnswerCorrelation[];
}

export interface CorrelationData {
  surveyId: string;
  title: string;
  correlations: QuestionCorrelation[];
}
