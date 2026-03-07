CREATE TABLE "mfa_secrets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"encrypted_secret" text NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"recovery_codes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "mfa_secrets_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "mfa_secrets" ADD CONSTRAINT "mfa_secrets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;