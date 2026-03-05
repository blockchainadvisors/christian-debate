# Christian Debate — Structured Discussion Platform: Implementation Plan

## Context

Build a structured debate platform for a Christian-focused niche that solves the core problems of Reddit/StackOverflow-style discussions: users having to dig for good arguments, losing context in deep threads, and lack of meaningful voting analytics. The platform's key innovation is a **multi-view system** that re-projects the same comment data through different lenses (Thread, Sides, Best Exchanges, Neutral Verdict).

The architecture includes a Hub-and-Spoke federation model for multi-site deployment, an analytics/correlation engine, and survey integration. All three phases are covered in this plan.

Source: `docs/initial_conversation.txt` contains the full spec discussion.

---

## Technology Stack (verified against latest docs — March 2026)

| Layer | Choice | Version / Notes |
|---|---|---|
| Framework | Next.js (App Router), TypeScript (strict) | **v16.x** (v16.1.6 latest). Uses `cacheComponents` instead of deprecated `experimental.dynamicIO`. React 19 |
| Database | PostgreSQL 16+ via Drizzle ORM | **drizzle-kit 0.31.x**. Use new builder-style schema: `t.uuid().defaultRandom().primaryKey()`. Built-in `drizzle-seed` for seeding |
| Cache | Redis 7+ | |
| Auth | Auth.js v5 (`next-auth`) | Stable. Use `@auth/drizzle-adapter` for Drizzle. Simplified env vars: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, etc. Export `{ handlers, auth, signIn, signOut }` from `auth.ts` |
| Rich Text | TipTap (`@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`) | Must use `immediatelyRender: false` in `useEditor()` for Next.js SSR compatibility. Mark components with `'use client'` |
| Styling | Tailwind CSS **v4** + shadcn/ui **v3.5+** | Tailwind v4 is a ground-up rewrite: CSS-first config via `@theme` directive (no `tailwind.config.js`). shadcn/ui fully supports Tailwind v4 + React 19 |
| Real-time | Server-Sent Events (SSE) | |
| Testing | Vitest + Playwright | |
| Dev Environment | Docker Compose (Postgres + Redis) | |
| Search | Meilisearch (Phase 3 cross-site search) | |
| Virtualization | TanStack Virtual v3 (`@tanstack/react-virtual`) | Headless, framework-agnostic virtualizer for comment trees |
| OIDC | `oidc-provider` (`panva/node-oidc-provider`) | OpenID Certified. Hub SSO |
| Monorepo | Turborepo + pnpm workspaces | shadcn CLI supports `Next.js (Monorepo)` scaffold directly. Structure: `packages/site`, `packages/shared`, `packages/hub` |

---

## Implementation Tasks

### Task 1: Project Scaffold + Docker
- Use `npx shadcn@latest init` → select "Next.js (Monorepo)" to scaffold Turborepo + Next.js + Tailwind v4 + shadcn/ui in one step
- Restructure into `packages/site` (main app), `packages/shared` (types/utils), `packages/hub` (empty placeholder for Phase 3)
- Verify Next.js 16.x with App Router, TypeScript strict mode, React 19
- Verify Tailwind CSS v4 with `@theme` directive in CSS (no `tailwind.config.js`)
- Create `docker-compose.yml` with Postgres 16 + Redis 7
- Create `.env.local` template with `DATABASE_URL`, `REDIS_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`
- Install and configure Drizzle ORM (`drizzle-orm`, `drizzle-kit`, `@auth/drizzle-adapter`) with `drizzle.config.ts` pointing to Postgres
- Configure Turborepo (`turbo.json`) with `extends: ["//"]` pattern for package-level overrides, tasks for build/dev/lint

### Task 2: Database Schema (All Phase 1+2 Tables)
Use Drizzle's new builder-style syntax: `pgTable("name", (t) => ({ id: t.uuid().defaultRandom().primaryKey(), ... }))`

**Tables to create:**
- `users` — id, username, displayName, email, avatarUrl, createdAt, trustTier (enum: new/established/trusted/moderator/admin)
- `debates` — id, title, slug, description, createdBy, sideALabel, sideBLabel, status, tags, timestamps
- `debate_stances` — id, debateId, userId, declaredStance (side_a/side_b/neutral), algorithmicLean (computed), leanConfidence, previousStance, timestamps. UNIQUE(debateId, userId)
- `comments` — id, debateId, authorId, parentId, rootId, depth, content, stanceSide (side_a/side_b/neutral/meta), ancestorPath (uuid[]), isQuarantined, quarantineReason, status, timestamps
- `votes` — id, commentId, userId, direction (up/down), reason (enum — see below), weight, createdAt. UNIQUE(commentId, userId)
- `stance_shifts` — id, debateId, userId, fromStance, toStance, triggeredByCommentId, shiftedAt, note
- `verdict_votes` — id, debateId, voterId, winningSide, voterStance, pinnedCommentId, createdAt. UNIQUE(debateId, voterId)
- `argument_tags` — id, commentId, taxonomy (empirical/moral_ethical/economic/procedural/anecdotal/legal/historical), taggedBy, createdAt
- `burden_of_proof_requests` — id, commentId, flagCount, status, citationUrl, citationUpvotes, timestamps
- `federated_identity` — id, localUserId, hubUserId, linkedAt, syncedAt. UNIQUE(localUserId) *(placeholder for Phase 3)*
- Auth.js required tables via `@auth/drizzle-adapter`: `accounts`, `sessions`, `verification_tokens` (adapter handles schema)

**Vote reason enums:**
- Upvote: well_reasoned, well_sourced, changed_my_mind, strong_counterpoint, well_written
- Downvote: off_topic, uncivil, misleading_unsourced, misrepresented_stance, low_effort

**Key indexes:** comments(debateId, createdAt), comments(debateId, stanceSide), votes(commentId), votes(userId, commentId) UNIQUE, comments(parentId), GIN on ancestorPath, stances(debateId, userId), verdict(debateId)

**Seed script:** Use `drizzle-seed` package for generating realistic debate data with 50+ comments at various depths, multiple stances, varied vote patterns with reasons. Supplement with custom seed logic for domain-specific relationships.

### Task 3: Auth System
- Auth.js v5 setup: create `auth.ts` exporting `{ handlers, auth, signIn, signOut }` from `NextAuth()`
- Configure `DrizzleAdapter(db)` from `@auth/drizzle-adapter`
- Providers: `Google` + `GitHub` (auto-infer from `AUTH_GOOGLE_ID`/`AUTH_GITHUB_ID` env vars) + `Credentials` for email/password
- JWT strategy with custom callbacks to include userId in session
- API route handler: `export const { GET, POST } = handlers` in `app/api/auth/[...nextauth]/route.ts`
- Protected routes middleware using `auth()` helper
- User settings page skeleton
- `AGORA_HUB_URL` env var placeholder (empty = no federation)

### Task 4: Debate CRUD
- Create debate form: title, description (TipTap editor), side A/B labels, tags
- Debate listing page (`/debates`) with search/filter by tags, status
- Landing page (`/`) with featured/trending debates
- Debate detail page (`/d/[slug]`) — main container with `ViewSwitcher` component
- API routes: `GET/POST /api/debates`, `GET/PATCH /api/debates/[slug]`

### Task 5: Comment System + Compressed Ancestor Trail
- `CommentTree` (recursive nested renderer) + `CommentCard` components
- TipTap rich text editor (`'use client'` component) for comment creation:
  - Install: `@tiptap/react @tiptap/pm @tiptap/starter-kit`
  - Use `useEditor({ extensions: [StarterKit], immediatelyRender: false })` to avoid SSR hydration issues
  - Include `StancePicker` (which side is this comment arguing for?)
- **Compressed Ancestor Trail** (`AncestorTrail` component): sticky bar at top showing parent chain when scrolled deep — each ancestor shows author, stance badge, first ~80 chars, clickable to scroll/expand
- Renders from `comment.ancestorPath` (materialized path)
- Virtual windowing via `@tanstack/react-virtual` v3 for performance on long threads
- Visual flattening at depth 6+ (no further indentation, logical nesting preserved)
- Deep-link to specific comments (`/d/[slug]/comment/[id]`)
- Collapse/expand subtrees
- API routes: `GET/POST /api/debates/[slug]/comments`, `GET/PATCH/DELETE /api/comments/[id]`, `GET /api/comments/[id]/context`

### Task 6: Stance Declaration + Badges
- `StanceDeclaration` modal/inline component for choosing Pro/Con/Neutral per debate
- `StanceBadge` component rendered on every comment showing author's declared stance
- Stance change tracking → creates `stance_shifts` record with optional triggering comment
- API routes: `GET/POST /api/debates/[slug]/stances`

### Task 7: Reasoned Voting System
- `VoteButton` with `ReasonPicker` dropdown/popover showing categorized reasons
- `VoteBreakdown` component showing visual breakdown of vote reasons per comment
- One vote per user per comment; re-voting replaces previous
- Weighted score computation: `changed_my_mind` = 3x, `well_sourced` = 2x, others = 1x, downvotes = -1x
- Vote weight influenced by user `trustTier`
- Score precomputation cached in Redis
- API route: `POST /api/comments/[id]/vote`

### Task 8: Thread View (Default)
- Full chronological view with nested comments
- Ancestor trail integration
- Infinite scroll with virtual windowing
- Stance badges on all comments
- Vote controls and breakdown on each comment
- Default view when navigating to `/d/[slug]`

### Task 9: Sides View
- Desktop: two columns (Side A left, Side B right), toggleable Neutral section
- Mobile: tab bar [Side A | Side B | Neutral]
- `CompactCommentPreview` cards: author, stance badge, ~200 chars, vote breakdown by reason
- Sorted by weighted vote score
- "View in Context" button → navigates to Thread View, scrolls to comment, highlights it with ancestor trail visible
- Redis caching for sorted results (60s TTL, invalidated on new votes)
- Query param: `/d/[slug]?view=sides`

### Task 10: Best Exchanges View
- Algorithm to find high-scoring Pro/Con reply pairs:
  1. Find comment pairs where B replies to A, opposing stanceSide, both above 75th percentile score
  2. Pair score: `min(A.score, B.score) * 2 + max(A.score, B.score)` (favors balanced exchanges)
  3. Extend to chains (3+ part exchanges when C opposes B and also scores well)
- `ExchangePair` component: paired/chained comments side-by-side (desktop) or stacked with visual connectors (mobile)
- Each card links to full thread context
- Sortable by: pair score, recency, stance shifts triggered
- Query param: `/d/[slug]?view=exchanges`

### Task 11: Neutral Verdict View
- Hero section: large tally bar showing Neutral users' verdict votes (Side A winning / Side B winning / Draw)
- Live updates via SSE
- Below: comments that Neutral users pinned as decisive, sorted by pin count
- Stats panel: total neutral voters, percentage of "verified neutrals" (algorithmicLean is neutral/mixed with leanConfidence < 0.3)
- "Verified Neutrals only" filter
- API routes: `GET/POST /api/debates/[slug]/verdict`
- Query param: `/d/[slug]?view=verdict`

### Task 12: Algorithmic Stance Detection
- Background job (runs periodically per active debate)
- For each user: count comments/votes per side, compute lean score (-1 to +1)
- Set `algorithmicLean` and `leanConfidence` in `debate_stances`
- Display "Leans [Side] based on activity" badge only when declared Neutral AND confidence > 0.5
- Transparent, non-punitive — data speaks for itself

### Task 13: Burden of Proof Mechanic
- When a comment gets 3+ `misleading_unsourced` downvotes:
  - System pins "Citation Requested" notice
  - Author notified, can add source URL
  - If citation gets 3+ `well_sourced` upvotes → penalty reversed
  - After 72 hours with no citation → labeled "Unsupported Claim"
- `BurdenOfProof` component for displaying the notice and citation flow

### Task 14: Moderation System
- **Quarantine**: comments auto-collapsed (not deleted) when:
  - High `uncivil` downvote rate (5+ in first 10 minutes)
  - Account in `new` tier + spam patterns
  - Collapsed with "This comment has been collapsed due to community flags. [Click to read] [Appeal]"
- **Trust Tiers**: new (< 7 days or < 5 comments) → established (7+ days, 10+ net-positive comments) → trusted (30+ days, high rep, low quarantine) → moderator → admin
  - new: votes don't count toward Verdict, rate-limited posting
  - established: full voting weight, can tag argument taxonomy
  - trusted: can vote on mod appeals, 1.5x vote weight in analytics
- Mod dashboard (`/moderation`): quarantine queue, appeal resolution, thread locking
- Report button on comments

### Task 15: Argument Taxonomy Tagging
- When posting top-level arguments, optional tag prompt: Empirical, Moral/Ethical, Economic, Procedural, Anecdotal, Legal, Historical
- Established+ users can tag others' comments
- Displayed as small label on comment cards

### Task 16: User Profiles + Reputation
- Public profile page (`/u/[username]`)
- Stats: vote tallies, comment count, debates participated, persuasion rating (changed_my_mind received), stance shift history
- Reputation score computation (weighted aggregate of upvotes received by reason)
- Trust tier badge display

### Task 17: Mobile Responsiveness Pass
- Mobile-first design across all pages
- Swipeable tabs for view switching
- Responsive comment cards, editor, and all modals
- Touch-friendly vote controls

### Task 18: Seed Data + Testing
- Comprehensive seed script with realistic debate data
- Vitest unit tests for: vote scoring, stance detection algorithm, exchange pairing algorithm, burden of proof state machine
- Playwright E2E tests for: auth flow, create debate, post comments, vote, switch views, view in context navigation

---

## Phase 3: Analytics, Federation & Correlation Engine

### Task 19: Analytics Dashboard
- Per-debate analytics view (`/d/[slug]?view=analytics`)
- `StanceTimeline` — line chart of stance distribution over time
- `VoteReasonChart` — breakdown of which vote reasons dominate
- `PersuasionLeaderboard` — top users by `changed_my_mind` received
- `TaxonomyBreakdown` — which argument types (empirical, moral, etc.) are winning
- Engagement depth histogram (how deep threads go before engagement drops)
- Cohort snapshots: periodic automated snapshots of debate state for time-series analysis

### Task 20: Engagement Fingerprinting
- Background job computes per-user profile vector stored as JSONB in `users.engagementFingerprint`:
  - `debatesEngaged`, `avgStance` (-1 to 1), `stanceConsistency`, `mindChangeRate`
  - `argumentStyleWeights` (empirical/moral/economic/anecdotal proportions)
  - `engagementDepth` (shallow/moderate/deep), `persuasionScore`
  - `upvoteReasonProfile` (what kinds of upvotes they receive)
- Used as independent variable for survey correlations
- Privacy: never shared cross-site by default, opt-in only (category weights only, not raw data)

### Task 21: Hub Service — Scaffold + OIDC Provider
- Build `packages/hub` as a separate Next.js service
- Hub database schema:
  - `hub_users` — global identity (id, email, displayName, avatarUrl, globalReputationScore, profileVisibility)
  - `site_registrations` — registered sites (name, slug, baseUrl, apiKey, trustStatus, niche)
  - `profile_links` — maps hub user to site-local accounts, per-site visibility (public/mutual_only/private)
  - `reputation_snapshots` — periodically synced per-user per-site reputation data
- Implement OIDC provider using `oidc-provider` npm package
- Endpoints: `/.well-known/openid-configuration`, `/oauth/authorize`, `/oauth/token`, `/oauth/userinfo`, `/oauth/jwks`
- ID token claims: sub, email, name, picture, agora_sites

### Task 22: Site SSO Integration
- Configure Auth.js on each site as OIDC client to the Hub
- "Sign in with Agora" button alongside existing OAuth providers
- First-visit flow: Hub redirect → authorize → create local account + FederatedIdentity link
- "Link to Agora Network" button in user settings for existing local accounts
- Key principle: local account creation always works without Hub; Hub linking is opt-in

### Task 23: Site Registration + API Key Management
- Hub admin panel for registering new sites
- Site provides: name, URL, admin email, niche description
- Hub returns: client_id, client_secret (OIDC), api_key (Federation API)
- Trust statuses: pending → verified (after admin review or domain verification) → suspended
- Hub admin dashboard: site management, network health, sync timestamps

### Task 24: Profile Linking Flow
- User settings → "Agora Network" section
- Link/unlink profile to Hub
- Per-site visibility controls: Public (anyone can see), Mutual (only on co-participated sites), Private (SSO only)
- Default visibility: Private

### Task 25: Reputation Sync + Cross-Site Display
- Background job on each site (every 6 hours): compute reputation snapshots for federated users, push to Hub
- Hub aggregation algorithm with **diminishing returns**: site 1 = 1.0 weight, site 2 = 0.6, site 3 = 0.4, etc. Weighted by site trust status and user engagement depth
- Each site caches `CrossSiteReputation` locally (1 hour TTL from Hub API)
- Enhanced `UserProfileCard` showing: local stats + cross-site aggregate (global rep, total minds changed, top contributions across sites)
- Graceful degradation: Hub down → show last cached value or nothing

### Task 26: Federation API
- **Hub endpoints** (called by sites, authenticated with site API key + HMAC-SHA256 signature):
  - `POST /federation/sync-reputation` — site pushes user reputation snapshot
  - `GET /federation/user/:hubUserId/cross-site-reputation` — aggregated rep (respects user visibility)
  - `GET /federation/user/:hubUserId/activity` — public debate participations across sites
  - `GET /federation/sites` — registry of verified sites
  - `POST /federation/verify-link` — confirm profile link validity
- **Site endpoints** (called by Hub):
  - `GET /api/federation/user/:id/reputation` — this site's snapshot
  - `GET /api/federation/user/:id/highlights` — top 5 comments (truncated, with debate title/link)
  - `GET /api/federation/stats` — site-level engagement stats
- Security: `X-Agora-Site-Id` + `X-Agora-Signature` (HMAC-SHA256) + `X-Agora-Timestamp` (reject >5min old)

### Task 27: Survey Integration API
- Create surveys linked to debates
- Survey responses tied to user engagement fingerprints
- Correlation engine: cross-reference survey answers with stance positions, argument style weights, vote patterns
- Key insight: "users who respond to economic arguments in debate X vote for candidate Y"
- Cross-site correlations (Phase 3 ultimate play): correlate stances across multiple niche debates with survey responses
- Export API for anonymized research data

### Task 28: Cross-Site Features
- Cross-site comment highlights: top 5 comments (200 chars) shown on network profile (opt-in only)
- Network-wide search via Meilisearch: Hub indexes debate metadata from all sites
- Cross-site leaderboards: most persuasive users across all sites
- Network discovery: browse sites in the network, see aggregate stats

### Task 29: Privacy + GDPR Tooling
- User controls: profile visibility, cross-site rep display, comment highlights sharing, fingerprint sharing — all defaulting to private/off
- **Data residency**: comment content/votes NEVER leave originating site; Hub only gets computed snapshots
- Account deletion cascade: Hub deletion → triggers deletion on all linked sites within 72 hours
- Data export: self-service portal for all Hub data (profile links, reputation history)
- Hub maintains data processing agreement template for site admins

### Task 30: Hub Admin Dashboard
- Registered sites overview (verified/pending/suspended)
- Total linked users, profile links count
- Network health: last sync from each site, stale data warnings
- User disputes: cross-site abuse reports, duplicate account merging
- Account deletion processing (GDPR)
- Rogue site mitigation: suspend site → exclude from aggregations, quarantine reputation data

### Task 31: Deployment Configuration
- **Single-operator setup**: Docker Compose with Hub + N sites + shared Postgres (separate DBs) + shared Redis, Nginx reverse proxy
- **Distributed setup**: independent operators, each running own site, connecting to central Hub over HTTPS
- **No-Hub setup**: standalone mode, all federation features disabled
- Production docker-compose with proper networking, volumes, health checks

---

## Key Architecture Decisions

1. **Materialized path** (`ancestorPath` uuid array) for O(1) ancestor chain lookups — critical for the Ancestor Trail feature
2. **Redis caching** for all computed rankings (Sides View, Best Exchanges, Verdict tallies) — 60s TTL prevents DB hammering
3. **SSE (not WebSockets)** for live verdict updates — simpler, sufficient for one-directional live data
4. **Virtual windowing** via TanStack Virtual v3 for long threads — prevents DOM bloat in deep debates
5. **Trust tier weighting** on votes — new accounts can't manipulate rankings
6. **Algorithmic (not social) stance verification** — removes adversarial dynamics from the "dishonest stance" problem
7. **Tailwind v4 CSS-first theming** — design tokens defined via `@theme` directive in CSS, no JS config file. Enables future per-site theming for federation
8. **TipTap `immediatelyRender: false`** — all editor components must be `'use client'` and disable SSR rendering to avoid hydration mismatches with Next.js 16
9. **Auth.js Drizzle adapter** — `@auth/drizzle-adapter` handles auth tables natively; custom user fields (trustTier, reputation) extend the adapter schema

---

## Verification Plan

1. **Database**: Run migrations, verify all tables and indexes created correctly
2. **Auth**: Register via email and OAuth, verify session persistence, test protected routes
3. **Debates**: Create debate, verify listing/search, navigate via slug
4. **Comments**: Post top-level + nested replies at various depths, verify ancestor trail appears when scrolling deep, test collapse/expand
5. **Stances**: Declare stance, verify badge on all user comments in that debate, change stance and verify delta tracking
6. **Voting**: Test all vote reasons, verify weighted score computation, verify one-vote constraint, verify Redis cache invalidation
7. **Thread View**: Verify chronological ordering, virtual scrolling, deep-link to specific comments
8. **Sides View**: Verify filtering by stance, sorting by weighted score, "View in Context" navigation with highlighting
9. **Best Exchanges**: Verify pairing algorithm surfaces balanced exchanges, test with seed data
10. **Neutral Verdict**: Cast verdict votes, verify live tally updates via SSE, test "Verified Neutrals only" filter
11. **Algorithmic Stance**: Post one-sided comments as "Neutral" user, verify "Leans [Side]" indicator appears
12. **Burden of Proof**: Accumulate misleading_unsourced downvotes, verify citation request appears, test citation resolution flow
13. **Moderation**: Trigger quarantine via rapid uncivil downvotes, test appeal flow, verify trust tier progression
14. **Mobile**: Test all views on 375px and 768px viewports
15. **Seed data**: Run seed script, verify all views populate correctly with realistic data
16. **Analytics**: Verify charts render with seed data, cohort snapshots capture state correctly
17. **Engagement Fingerprint**: Verify profile vector computation from seed data activity
18. **Hub SSO**: Register a site with Hub, sign in via OIDC flow, verify FederatedIdentity created
19. **Profile Linking**: Link profile from site settings, verify visibility controls work (public/mutual/private)
20. **Reputation Sync**: Trigger sync job, verify Hub receives snapshot, verify cross-site reputation displays on profile card
21. **Federation Security**: Verify HMAC signatures reject tampered requests, verify timestamp replay protection
22. **Graceful Degradation**: Disconnect Hub, verify site continues working with stale/no cross-site data
23. **Survey Correlation**: Create survey, link to debate, verify fingerprint-based correlations
24. **GDPR**: Delete Hub account, verify cascade to linked sites within expected timeframe
25. **Deployment**: Test Docker Compose single-operator setup with Hub + 2 sites
