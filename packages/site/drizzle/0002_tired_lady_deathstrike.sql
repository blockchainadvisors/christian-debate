CREATE TABLE "promoted_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"debate_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"direct_reply_count" integer NOT NULL,
	"score_at_promotion" integer NOT NULL,
	"promoted_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "promoted_comments_comment_id_unique" UNIQUE("comment_id")
);
--> statement-breakpoint
ALTER TABLE "promoted_comments" ADD CONSTRAINT "promoted_comments_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promoted_comments" ADD CONSTRAINT "promoted_comments_debate_id_debates_id_fk" FOREIGN KEY ("debate_id") REFERENCES "public"."debates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promoted_comments" ADD CONSTRAINT "promoted_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;