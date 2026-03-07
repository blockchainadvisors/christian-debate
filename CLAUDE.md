# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development (from repo root — uses Turborepo)
pnpm dev                    # Start all packages (site on :3000, hub on :4000)
pnpm build                  # Build all packages
pnpm lint                   # Lint all packages

# Database (Drizzle ORM)
pnpm db:generate            # Generate migration files from schema changes
pnpm db:migrate             # Apply migrations to DATABASE_URL
pnpm db:seed                # Seed with test data (tsx src/db/seed.ts)

# Tests (from packages/site)
pnpm --filter site exec vitest run                    # Run all unit tests
pnpm --filter site exec vitest run src/lib/__tests__/vote-scoring.test.ts  # Single test file
pnpm --filter site exec vitest --watch                # Watch mode

# E2E (Playwright — requires running dev server)
pnpm --filter site exec playwright test               # All E2E tests
pnpm --filter site exec playwright test e2e/comprehensive.spec.ts  # Single spec

# Type checking
pnpm --filter site exec tsc --noEmit
```

## Architecture

### Monorepo Structure (Turborepo + pnpm)

- **`packages/site`** — Main Next.js 16 app (App Router, React 19). The debate platform.
- **`packages/hub`** — Federation hub server (Next.js + oidc-provider). Phase 3, mostly scaffolded.
- **`packages/shared`** — Shared TypeScript types/enums between site and hub.

### Data Layer

- **ORM:** Drizzle ORM with `postgres` driver. Schema in `packages/site/src/db/schema.ts`.
- **DB client:** `packages/site/src/db/index.ts` exports `db` (drizzle instance).
- **Drizzle config:** `packages/site/drizzle.config.ts` — migrations output to `packages/site/drizzle/`.
- **Redis:** ioredis client at `packages/site/src/lib/redis.ts` for vote breakdown caching.

### Authentication (Auth.js v5)

- Config: `packages/site/src/lib/auth/index.ts`
- Providers: Google OAuth, Apple, Facebook, Microsoft Entra ID, Credentials (bcrypt + TOTP MFA), Email (magic links via nodemailer), Agora OIDC (conditional on `AGORA_HUB_URL`)
- Strategy: JWT sessions
- Env vars use Auth.js simplified naming: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, etc.
- **Email/Password Registration:** `POST /api/auth/register` creates user with `emailVerified: null`, sends verification email. Unverified users cannot sign in via credentials.
- **Email Verification:** `GET /api/auth/verify-email?token=...&email=...` validates token, marks user verified. Resend via `POST /api/auth/resend-verification`.
- **Magic Links:** Auth.js Email provider, auto-creates accounts for new emails (Slack/Notion pattern). 10-minute expiry.
- **Password Reset:** `POST /api/auth/forgot-password` (never leaks email existence), `POST /api/auth/reset-password` with token. Reset page at `/reset-password`.
- **MFA (TOTP):** Optional per-user. Setup: `POST /api/auth/mfa/setup` returns QR + secret, `POST /api/auth/mfa/verify` confirms with 6-digit code and returns 8 recovery codes. Disable: `DELETE /api/auth/mfa/setup` with code. Secrets encrypted with AES-256-GCM using `AUTH_SECRET`. MFA utility at `packages/site/src/lib/auth/mfa.ts`.
- **Rate Limiting:** Redis-based (`packages/site/src/lib/rate-limit.ts`). Registration: 5/hr/IP, credentials login: 10/15min/email, magic link: 3/hr/email, resend verification: 1/60s/email, forgot password: 3/hr/email.
- `generateUniqueUsername` lives in `packages/site/src/lib/auth/utils.ts` (shared by registration, OAuth, and magic link flows).
- Apple Sign In: secret auto-generated at runtime from `.p8` key (`packages/site/src/lib/auth/apple-secret.ts`), self-renewing, no manual intervention needed. Apple Developer Team ID: `GN86WL6B9C`, Key ID: `327KK4ZZHV`, Services ID: `com.christiansdebate.web`.
- Facebook: App ID `1604518684217333`. Data deletion callback at `api/auth/facebook/data-deletion`. App is Live (published).
- Microsoft Entra ID: App ID `62fe729a-e051-49ff-b39d-6cdb46e4345c`. Issuer uses `/common/v2.0` for personal + work accounts. Secret expires 2028-05-03.
- Auth config uses lazy evaluation (`NextAuth(() => ({...}))`) so Apple secret auto-renews even without server restart.
- Server-side auth check pattern: `const session = await auth(); if (!session?.user?.id) return 401`
- Client-side: `useSession()` from `next-auth/react`

### Deployment & Process Management

- **Process manager:** pm2 (accessed via `npx pm2`)
- **Dev process name:** `christian-debate-dev`
- **Production URL:** `christiansdebate.com`
- **Staging URL:** `debates-staging.badev.tools`
- **Env file:** `packages/site/.env.local`
- **Secrets:** `secrets/` directory at repo root (gitignored). Apple `.p8` key in `secrets/apple/`.
- **Restart dev:** `npx pm2 restart christian-debate-dev`
- **Logs:** `npx pm2 logs christian-debate-dev --lines 20 --nostream`

### Theme System (10 themes)

- Theme definitions: `packages/site/src/lib/themes.ts`
- CSS variables: `packages/site/src/app/themes.css` — uses `html[data-theme="x"]` selectors
- ThemeProvider: `packages/site/src/components/theme-provider.tsx` — sets `data-theme` attribute on `<html>`, loads Google Fonts dynamically, persists to localStorage
- Default theme: `nordic-clean`

### Five-View Debate System

The debate detail page (`/d/[slug]/`) shows the same comment data through 5 tab views:
1. **Thread** — Chronological tree with nested replies
2. **Sides** — Top comments split by Side A vs Side B
3. **Best Exchanges** — High-scoring back-and-forth pairs (algorithm in `lib/exchange-pairing.ts`)
4. **Neutral Verdict** — Only neutral users' votes/highlights
5. **Analytics** — Dashboard with stance correlations and charts

### Voting System

- Reason-based voting (5 upvote reasons, 5 downvote reasons) — not simple +1/-1
- Vote weight varies by trust tier: new=0.5, established=1.0, trusted=1.5, mod/admin=2.0
- Scoring logic: `packages/site/src/lib/vote-scoring.ts`
- One vote per user per comment (DB unique constraint, upsert on change)

### Email Infrastructure

- **Dev/Staging:** Mailpit (SMTP on `:1025`, web UI on `:8025`). No auth needed.
- **Production:** Mailjet SMTP (use `SMTP_USER`/`SMTP_PASSWORD` env vars).
- **Email service:** `packages/site/src/lib/email/index.ts` — lazy singleton nodemailer transporter.
- **Email templates:** `packages/site/src/lib/email/templates.ts` — verification, magic link, password reset, MFA enabled.
- **Env vars:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`.
- **`.npmrc`** has `public-hoist-pattern[]=nodemailer` so `@auth/core`'s internal email provider can resolve it under pnpm strict mode.

### Guest Mode

- Unauthenticated users can comment/vote with data cached in `localStorage` (key: `cd_guest_cache`)
- Guest cache: `packages/site/src/lib/guest-cache.ts` (max 50 comments, 100 votes)
- Auto-submits via `POST /api/guest/submit` bulk endpoint when user logs in
- Navigation guard warns before losing unsaved guest data

## Important Gotchas

- **Next.js 16 CSS hash bug:** Production build generates CSS with wrong hash. Workaround: `scripts/fix-css-hashes.sh` runs automatically after `next build`.
- **TipTap editors** must be client components with `immediatelyRender: false` for SSR compatibility.
- **Tailwind v4** uses CSS-first config (`@theme` directive in CSS) — there is no `tailwind.config.js`.
- **Playwright theme screenshots** require `page.evaluate()` to set `data-theme` attribute directly (not just localStorage) to ensure CSS applies before screenshot.
- **Drizzle adapter** for Auth.js manages its own tables (accounts, sessions, verification_tokens). Don't modify these manually.
- **Next.js output** is set to `"standalone"` in `next.config.ts`.
- **pnpm hoisting:** `.npmrc` has `public-hoist-pattern[]=nodemailer` — required for `@auth/core`'s internal email provider to resolve nodemailer under pnpm strict mode.
- **Drizzle migrate needs DATABASE_URL:** `pnpm db:migrate` may fail if `.env.local` isn't loaded. Run directly: `DATABASE_URL=postgresql://dev:dev@localhost:5432/christian_debate pnpm --filter site exec drizzle-kit migrate`.

## Key Paths

| Purpose | Path |
|---------|------|
| DB schema | `packages/site/src/db/schema.ts` |
| API routes | `packages/site/src/app/api/` |
| Components | `packages/site/src/components/` |
| Business logic | `packages/site/src/lib/` |
| Types | `packages/site/src/types/` |
| Unit tests | `packages/site/src/lib/__tests__/` |
| E2E tests | `packages/site/e2e/` |
| Seed data | `packages/site/src/db/seed/` |
| Theme CSS | `packages/site/src/app/themes.css` |
| Privacy policy | `packages/site/src/app/privacy/page.tsx` |
| Terms of service | `packages/site/src/app/terms/page.tsx` |
| FB data deletion endpoint | `packages/site/src/app/api/auth/facebook/data-deletion/route.ts` |
| Secrets (gitignored) | `secrets/` |
| Apple secret generator | `packages/site/src/lib/auth/apple-secret.ts` |
| Apple secret script | `packages/site/scripts/generate-apple-secret.ts` |
| Email service | `packages/site/src/lib/email/index.ts` |
| Email templates | `packages/site/src/lib/email/templates.ts` |
| MFA utility | `packages/site/src/lib/auth/mfa.ts` |
| Auth utilities | `packages/site/src/lib/auth/utils.ts` |
| Rate limiter | `packages/site/src/lib/rate-limit.ts` |
| Registration API | `packages/site/src/app/api/auth/register/route.ts` |
| Email verification API | `packages/site/src/app/api/auth/verify-email/route.ts` |
| Password reset APIs | `packages/site/src/app/api/auth/{forgot,reset}-password/route.ts` |
| MFA APIs | `packages/site/src/app/api/auth/mfa/{setup,verify}/route.ts` |
| MFA settings component | `packages/site/src/components/auth/mfa-setup.tsx` |
| Auth form components | `packages/site/src/components/auth/{email-sign-in,register,magic-link,forgot-password}-form.tsx` |
