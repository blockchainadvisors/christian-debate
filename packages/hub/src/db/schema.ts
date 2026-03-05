import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  pgEnum,
  index,
  unique,
} from "drizzle-orm/pg-core";

// ── Enums ──────────────────────────────────────────────────────────────────

export const profileVisibilityEnum = pgEnum("profile_visibility", [
  "public",
  "mutual_only",
  "private",
]);

export const trustStatusEnum = pgEnum("trust_status", [
  "pending",
  "verified",
  "suspended",
]);

// ── Hub Users ──────────────────────────────────────────────────────────────

export const hubUsers = pgTable("hub_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  avatarUrl: text("avatar_url"),
  globalReputationScore: integer("global_reputation_score").notNull().default(0),
  profileVisibility: profileVisibilityEnum("profile_visibility")
    .notNull()
    .default("private"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Site Registrations ─────────────────────────────────────────────────────

export const siteRegistrations = pgTable("site_registrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  baseUrl: text("base_url").notNull().unique(),
  apiKey: varchar("api_key", { length: 255 }).notNull(),
  trustStatus: trustStatusEnum("trust_status").notNull().default("pending"),
  niche: text("niche"),
  adminEmail: varchar("admin_email", { length: 255 }),
  clientId: varchar("client_id", { length: 255 }).notNull().unique(),
  clientSecret: varchar("client_secret", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Profile Links ──────────────────────────────────────────────────────────

export const profileLinks = pgTable(
  "profile_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hubUserId: uuid("hub_user_id")
      .notNull()
      .references(() => hubUsers.id),
    siteId: uuid("site_id")
      .notNull()
      .references(() => siteRegistrations.id),
    localUserId: varchar("local_user_id", { length: 255 }).notNull(),
    visibility: profileVisibilityEnum("visibility").notNull().default("private"),
    linkedAt: timestamp("linked_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique().on(table.hubUserId, table.siteId)],
);

// ── Reputation Snapshots ───────────────────────────────────────────────────

export const reputationSnapshots = pgTable(
  "reputation_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hubUserId: uuid("hub_user_id")
      .notNull()
      .references(() => hubUsers.id),
    siteId: uuid("site_id")
      .notNull()
      .references(() => siteRegistrations.id),
    reputationScore: integer("reputation_score").notNull(),
    persuasionRating: integer("persuasion_rating").notNull(),
    commentCount: integer("comment_count").notNull(),
    debateCount: integer("debate_count").notNull(),
    snapshotAt: timestamp("snapshot_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("reputation_snapshots_user_site_time_idx").on(
      table.hubUserId,
      table.siteId,
      table.snapshotAt,
    ),
  ],
);

export type HubUser = typeof hubUsers.$inferSelect;
export type NewHubUser = typeof hubUsers.$inferInsert;
export type SiteRegistration = typeof siteRegistrations.$inferSelect;
export type NewSiteRegistration = typeof siteRegistrations.$inferInsert;
export type ProfileLink = typeof profileLinks.$inferSelect;
export type NewProfileLink = typeof profileLinks.$inferInsert;
export type ReputationSnapshot = typeof reputationSnapshots.$inferSelect;
export type NewReputationSnapshot = typeof reputationSnapshots.$inferInsert;
