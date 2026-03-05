import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  real,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
  jsonb,
} from "drizzle-orm/pg-core";

// ─── Enums ──────────────────────────────────────────────────────────

export const trustTierEnum = pgEnum("trust_tier", [
  "new",
  "established",
  "trusted",
  "moderator",
  "admin",
]);

export const debateStatusEnum = pgEnum("debate_status", [
  "open",
  "locked",
  "archived",
]);

export const stanceSideEnum = pgEnum("stance_side", [
  "side_a",
  "side_b",
  "neutral",
]);

export const commentStanceSideEnum = pgEnum("comment_stance_side", [
  "side_a",
  "side_b",
  "neutral",
  "meta",
]);

export const algorithmicLeanEnum = pgEnum("algorithmic_lean", [
  "side_a",
  "side_b",
  "neutral",
  "mixed",
]);

export const voteDirectionEnum = pgEnum("vote_direction", ["up", "down"]);

export const voteReasonEnum = pgEnum("vote_reason", [
  "well_reasoned",
  "well_sourced",
  "changed_my_mind",
  "strong_counterpoint",
  "well_written",
  "off_topic",
  "uncivil",
  "misleading_unsourced",
  "misrepresented_stance",
  "low_effort",
]);

export const commentStatusEnum = pgEnum("comment_status", [
  "active",
  "edited",
  "deleted_by_author",
  "removed_by_mod",
]);

export const verdictSideEnum = pgEnum("verdict_side", [
  "side_a",
  "side_b",
  "draw",
]);

export const argumentTaxonomyEnum = pgEnum("argument_taxonomy", [
  "empirical",
  "moral_ethical",
  "economic",
  "procedural",
  "anecdotal",
  "legal",
  "historical",
]);

export const burdenOfProofStatusEnum = pgEnum("burden_of_proof_status", [
  "pending",
  "citation_provided",
  "upheld",
  "dismissed",
]);

// ─── Users ──────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  trustTier: trustTierEnum("trust_tier").notNull().default("new"),
  reputationScore: integer("reputation_score").notNull().default(0),
  persuasionRating: integer("persuasion_rating").notNull().default(0),
  engagementFingerprint: jsonb("engagement_fingerprint"),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// ─── Auth.js tables ─────────────────────────────────────────────────

export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: varchar("token_type", { length: 255 }),
  scope: varchar("scope", { length: 255 }),
  id_token: text("id_token"),
  session_state: varchar("session_state", { length: 255 }),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: varchar("identifier", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// ─── Debates ────────────────────────────────────────────────────────

export const debates = pgTable("debates", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  slug: varchar("slug", { length: 300 }).notNull().unique(),
  description: text("description"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  sideALabel: varchar("side_a_label", { length: 100 }).notNull(),
  sideBLabel: varchar("side_b_label", { length: 100 }).notNull(),
  status: debateStatusEnum("status").notNull().default("open"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// ─── Debate Stances ─────────────────────────────────────────────────

export const debateStances = pgTable(
  "debate_stances",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    debateId: uuid("debate_id")
      .notNull()
      .references(() => debates.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    declaredStance: stanceSideEnum("declared_stance").notNull(),
    algorithmicLean: algorithmicLeanEnum("algorithmic_lean"),
    leanConfidence: real("lean_confidence"),
    previousStance: stanceSideEnum("previous_stance"),
    declaredAt: timestamp("declared_at", { mode: "date" }).notNull().defaultNow(),
    changedAt: timestamp("changed_at", { mode: "date" }),
  },
  (table) => [
    uniqueIndex("idx_stances_debate_user").on(table.debateId, table.userId),
    index("idx_stances_debate_declared").on(table.debateId, table.declaredStance),
  ]
);

// ─── Comments ───────────────────────────────────────────────────────

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    debateId: uuid("debate_id")
      .notNull()
      .references(() => debates.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id),
    parentId: uuid("parent_id"),
    rootId: uuid("root_id"),
    depth: integer("depth").notNull().default(0),
    content: text("content").notNull(),
    stanceSide: commentStanceSideEnum("stance_side").notNull(),
    ancestorPath: uuid("ancestor_path").array(),
    isQuarantined: boolean("is_quarantined").notNull().default(false),
    quarantineReason: varchar("quarantine_reason", { length: 255 }),
    status: commentStatusEnum("status").notNull().default("active"),
    score: integer("score").notNull().default(0),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    editedAt: timestamp("edited_at", { mode: "date" }),
  },
  (table) => [
    index("idx_comments_debate_created").on(table.debateId, table.createdAt),
    index("idx_comments_debate_stance").on(table.debateId, table.stanceSide),
    index("idx_comments_parent").on(table.parentId),
    index("idx_comments_author").on(table.authorId),
    // GIN index on ancestorPath for fast ancestor lookups
    // Note: Drizzle doesn't have native GIN syntax — added via raw SQL migration
  ]
);

// ─── Votes ──────────────────────────────────────────────────────────

export const votes = pgTable(
  "votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    commentId: uuid("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    direction: voteDirectionEnum("direction").notNull(),
    reason: voteReasonEnum("reason").notNull(),
    weight: real("weight").notNull().default(1.0),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_votes_user_comment").on(table.userId, table.commentId),
    index("idx_votes_comment").on(table.commentId),
  ]
);

// ─── Stance Shifts (Delta Events) ──────────────────────────────────

export const stanceShifts = pgTable(
  "stance_shifts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    debateId: uuid("debate_id")
      .notNull()
      .references(() => debates.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fromStance: stanceSideEnum("from_stance").notNull(),
    toStance: stanceSideEnum("to_stance").notNull(),
    triggeredByCommentId: uuid("triggered_by_comment_id").references(
      () => comments.id
    ),
    shiftedAt: timestamp("shifted_at", { mode: "date" }).notNull().defaultNow(),
    note: text("note"),
  },
  (table) => [
    index("idx_stance_shifts_debate").on(table.debateId, table.shiftedAt),
  ]
);

// ─── Verdict Votes ──────────────────────────────────────────────────

export const verdictVotes = pgTable(
  "verdict_votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    debateId: uuid("debate_id")
      .notNull()
      .references(() => debates.id, { onDelete: "cascade" }),
    voterId: uuid("voter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    winningSide: verdictSideEnum("winning_side").notNull(),
    voterStance: stanceSideEnum("voter_stance").notNull(),
    pinnedCommentId: uuid("pinned_comment_id").references(() => comments.id),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_verdict_debate_voter").on(table.debateId, table.voterId),
    index("idx_verdict_debate").on(table.debateId),
  ]
);

// ─── Argument Tags ──────────────────────────────────────────────────

export const argumentTags = pgTable("argument_tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  commentId: uuid("comment_id")
    .notNull()
    .references(() => comments.id, { onDelete: "cascade" }),
  taxonomy: argumentTaxonomyEnum("taxonomy").notNull(),
  taggedBy: uuid("tagged_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// ─── Burden of Proof Requests ───────────────────────────────────────

export const burdenOfProofRequests = pgTable("burden_of_proof_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  commentId: uuid("comment_id")
    .notNull()
    .references(() => comments.id, { onDelete: "cascade" })
    .unique(),
  flagCount: integer("flag_count").notNull().default(0),
  status: burdenOfProofStatusEnum("status").notNull().default("pending"),
  citationUrl: varchar("citation_url", { length: 1000 }),
  citationUpvotes: integer("citation_upvotes").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { mode: "date" }),
});

// ─── Federated Identity (Phase 3 placeholder) ──────────────────────

export const federatedIdentity = pgTable("federated_identity", {
  id: uuid("id").defaultRandom().primaryKey(),
  localUserId: uuid("local_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  hubUserId: uuid("hub_user_id").notNull(),
  linkedAt: timestamp("linked_at", { mode: "date" }).notNull().defaultNow(),
  syncedAt: timestamp("synced_at", { mode: "date" }),
});
