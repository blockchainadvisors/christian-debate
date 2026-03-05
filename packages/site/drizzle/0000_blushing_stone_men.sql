CREATE TYPE "public"."algorithmic_lean" AS ENUM('side_a', 'side_b', 'neutral', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."argument_taxonomy" AS ENUM('empirical', 'moral_ethical', 'economic', 'procedural', 'anecdotal', 'legal', 'historical');--> statement-breakpoint
CREATE TYPE "public"."burden_of_proof_status" AS ENUM('pending', 'citation_provided', 'upheld', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."comment_stance_side" AS ENUM('side_a', 'side_b', 'neutral', 'meta');--> statement-breakpoint
CREATE TYPE "public"."comment_status" AS ENUM('active', 'edited', 'deleted_by_author', 'removed_by_mod');--> statement-breakpoint
CREATE TYPE "public"."debate_status" AS ENUM('open', 'locked', 'archived');--> statement-breakpoint
CREATE TYPE "public"."stance_side" AS ENUM('side_a', 'side_b', 'neutral');--> statement-breakpoint
CREATE TYPE "public"."trust_tier" AS ENUM('new', 'established', 'trusted', 'moderator', 'admin');--> statement-breakpoint
CREATE TYPE "public"."verdict_side" AS ENUM('side_a', 'side_b', 'draw');--> statement-breakpoint
CREATE TYPE "public"."vote_direction" AS ENUM('up', 'down');--> statement-breakpoint
CREATE TYPE "public"."vote_reason" AS ENUM('well_reasoned', 'well_sourced', 'changed_my_mind', 'strong_counterpoint', 'well_written', 'off_topic', 'uncivil', 'misleading_unsourced', 'misrepresented_stance', 'low_effort');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "argument_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"taxonomy" "argument_taxonomy" NOT NULL,
	"tagged_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "burden_of_proof_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"flag_count" integer DEFAULT 0 NOT NULL,
	"status" "burden_of_proof_status" DEFAULT 'pending' NOT NULL,
	"citation_url" varchar(1000),
	"citation_upvotes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	CONSTRAINT "burden_of_proof_requests_comment_id_unique" UNIQUE("comment_id")
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debate_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"parent_id" uuid,
	"root_id" uuid,
	"depth" integer DEFAULT 0 NOT NULL,
	"content" text NOT NULL,
	"stance_side" "comment_stance_side" NOT NULL,
	"ancestor_path" uuid[],
	"is_quarantined" boolean DEFAULT false NOT NULL,
	"quarantine_reason" varchar(255),
	"status" "comment_status" DEFAULT 'active' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"edited_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "debate_stances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debate_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"declared_stance" "stance_side" NOT NULL,
	"algorithmic_lean" "algorithmic_lean",
	"lean_confidence" real,
	"previous_stance" "stance_side",
	"declared_at" timestamp DEFAULT now() NOT NULL,
	"changed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "debates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(300) NOT NULL,
	"slug" varchar(300) NOT NULL,
	"description" text,
	"created_by" uuid NOT NULL,
	"side_a_label" varchar(100) NOT NULL,
	"side_b_label" varchar(100) NOT NULL,
	"status" "debate_status" DEFAULT 'open' NOT NULL,
	"tags" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "debates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "federated_identity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"local_user_id" uuid NOT NULL,
	"hub_user_id" uuid NOT NULL,
	"linked_at" timestamp DEFAULT now() NOT NULL,
	"synced_at" timestamp,
	CONSTRAINT "federated_identity_local_user_id_unique" UNIQUE("local_user_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "stance_shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debate_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"from_stance" "stance_side" NOT NULL,
	"to_stance" "stance_side" NOT NULL,
	"triggered_by_comment_id" uuid,
	"shifted_at" timestamp DEFAULT now() NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(50) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"avatar_url" varchar(500),
	"trust_tier" "trust_tier" DEFAULT 'new' NOT NULL,
	"reputation_score" integer DEFAULT 0 NOT NULL,
	"persuasion_rating" integer DEFAULT 0 NOT NULL,
	"engagement_fingerprint" jsonb,
	"email_verified" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verdict_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debate_id" uuid NOT NULL,
	"voter_id" uuid NOT NULL,
	"winning_side" "verdict_side" NOT NULL,
	"voter_stance" "stance_side" NOT NULL,
	"pinned_comment_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"direction" "vote_direction" NOT NULL,
	"reason" "vote_reason" NOT NULL,
	"weight" real DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "argument_tags" ADD CONSTRAINT "argument_tags_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "argument_tags" ADD CONSTRAINT "argument_tags_tagged_by_users_id_fk" FOREIGN KEY ("tagged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "burden_of_proof_requests" ADD CONSTRAINT "burden_of_proof_requests_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_debate_id_debates_id_fk" FOREIGN KEY ("debate_id") REFERENCES "public"."debates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debate_stances" ADD CONSTRAINT "debate_stances_debate_id_debates_id_fk" FOREIGN KEY ("debate_id") REFERENCES "public"."debates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debate_stances" ADD CONSTRAINT "debate_stances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debates" ADD CONSTRAINT "debates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "federated_identity" ADD CONSTRAINT "federated_identity_local_user_id_users_id_fk" FOREIGN KEY ("local_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stance_shifts" ADD CONSTRAINT "stance_shifts_debate_id_debates_id_fk" FOREIGN KEY ("debate_id") REFERENCES "public"."debates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stance_shifts" ADD CONSTRAINT "stance_shifts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stance_shifts" ADD CONSTRAINT "stance_shifts_triggered_by_comment_id_comments_id_fk" FOREIGN KEY ("triggered_by_comment_id") REFERENCES "public"."comments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verdict_votes" ADD CONSTRAINT "verdict_votes_debate_id_debates_id_fk" FOREIGN KEY ("debate_id") REFERENCES "public"."debates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verdict_votes" ADD CONSTRAINT "verdict_votes_voter_id_users_id_fk" FOREIGN KEY ("voter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verdict_votes" ADD CONSTRAINT "verdict_votes_pinned_comment_id_comments_id_fk" FOREIGN KEY ("pinned_comment_id") REFERENCES "public"."comments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_comments_debate_created" ON "comments" USING btree ("debate_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_comments_debate_stance" ON "comments" USING btree ("debate_id","stance_side");--> statement-breakpoint
CREATE INDEX "idx_comments_parent" ON "comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_comments_author" ON "comments" USING btree ("author_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_stances_debate_user" ON "debate_stances" USING btree ("debate_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_stances_debate_declared" ON "debate_stances" USING btree ("debate_id","declared_stance");--> statement-breakpoint
CREATE INDEX "idx_stance_shifts_debate" ON "stance_shifts" USING btree ("debate_id","shifted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_verdict_debate_voter" ON "verdict_votes" USING btree ("debate_id","voter_id");--> statement-breakpoint
CREATE INDEX "idx_verdict_debate" ON "verdict_votes" USING btree ("debate_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_votes_user_comment" ON "votes" USING btree ("user_id","comment_id");--> statement-breakpoint
CREATE INDEX "idx_votes_comment" ON "votes" USING btree ("comment_id");
CREATE INDEX idx_comments_ancestor_path ON comments USING GIN(ancestor_path);
