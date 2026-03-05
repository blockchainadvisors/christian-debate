import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { users, debates } from "./schema";

// ─── Survey Enums ────────────────────────────────────────────────────

export const surveyStatusEnum = pgEnum("survey_status", [
  "draft",
  "active",
  "closed",
]);

export const questionTypeEnum = pgEnum("question_type", [
  "multiple_choice",
  "likert_scale",
  "free_text",
  "yes_no",
]);

// ─── Surveys ─────────────────────────────────────────────────────────

export const surveys = pgTable(
  "surveys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    debateId: uuid("debate_id").references(() => debates.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 300 }).notNull(),
    description: text("description"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    status: surveyStatusEnum("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    closedAt: timestamp("closed_at", { mode: "date" }),
  },
  (table) => [
    index("idx_surveys_status").on(table.status),
    index("idx_surveys_debate").on(table.debateId),
  ]
);

// ─── Survey Questions ────────────────────────────────────────────────

export const surveyQuestions = pgTable(
  "survey_questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    surveyId: uuid("survey_id")
      .notNull()
      .references(() => surveys.id, { onDelete: "cascade" }),
    questionText: text("question_text").notNull(),
    questionType: questionTypeEnum("question_type").notNull(),
    options: jsonb("options").$type<string[]>(),
    orderIndex: integer("order_index").notNull(),
    required: boolean("required").notNull().default(true),
  },
  (table) => [
    index("idx_survey_questions_survey").on(table.surveyId, table.orderIndex),
  ]
);

// ─── Survey Responses ────────────────────────────────────────────────

export const surveyResponses = pgTable(
  "survey_responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    surveyId: uuid("survey_id")
      .notNull()
      .references(() => surveys.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    submittedAt: timestamp("submitted_at", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_survey_responses_survey_user").on(
      table.surveyId,
      table.userId
    ),
  ]
);

// ─── Survey Answers ──────────────────────────────────────────────────

export const surveyAnswers = pgTable(
  "survey_answers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    responseId: uuid("response_id")
      .notNull()
      .references(() => surveyResponses.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => surveyQuestions.id, { onDelete: "cascade" }),
    answerValue: text("answer_value").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_survey_answers_response").on(table.responseId),
    index("idx_survey_answers_question").on(table.questionId),
  ]
);
