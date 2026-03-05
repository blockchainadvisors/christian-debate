# Christian Debate Platform — Architecture Document

**Version:** 1.0
**Date:** 2026-03-05
**Status:** Pre-implementation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture](#4-system-architecture)
5. [Data Model](#5-data-model)
6. [The View System](#6-the-view-system)
7. [Reasoned Voting System](#7-reasoned-voting-system)
8. [Moderation & Trust](#8-moderation--trust)
9. [Computed Systems & Background Jobs](#9-computed-systems--background-jobs)
10. [API Design](#10-api-design)
11. [Frontend Architecture](#11-frontend-architecture)
12. [Federation Architecture](#12-federation-architecture)
13. [Analytics & Correlation Engine](#13-analytics--correlation-engine)
14. [Security](#14-security)
15. [Deployment](#15-deployment)
16. [Phasing](#16-phasing)

---

## 1. Executive Summary

### The Problem

Existing discussion platforms (Reddit, StackOverflow, traditional forums) share three fundamental flaws:

1. **Discovery is broken.** Users must dig through noise to find the strongest arguments. The best comments are often buried deep in threads.
2. **Context is lost.** Deep threads force pagination or new pages, severing the connection between a comment and the conversation that produced it. Users cannot take meaningful screenshots or share context.
3. **Voting is shallow.** A single up/down vote conflates "I agree" with "this is well-reasoned" with "this changed my mind." The resulting scores are analytically useless.

### The Solution

Christian Debate is a structured discussion platform that solves these problems through:

- **Multiple views of the same conversation.** The same comment data is re-projected through five distinct lenses — chronological thread, side-by-side arguments, best cross-examinations, neutral verdict, and analytics — so users can discover the strongest arguments without digging.
- **Compressed ancestor trail.** A sticky breadcrumb bar preserves conversational context no matter how deep the thread goes, eliminating the "lost context" problem.
- **Reasoned voting.** Every vote requires a reason (well-reasoned, well-sourced, changed my mind, off-topic, misleading, etc.), producing rich analytical data about *why* arguments land, not just whether they do.
- **Stance transparency.** Users declare their position (Pro, Con, Neutral) per debate. The system algorithmically detects when behavior contradicts declared stance, surfacing this transparently rather than relying on adversarial user policing.
- **Federation-ready architecture.** The platform is designed to run as independent instances across different niches, optionally linking together via a lightweight Hub for cross-site identity and reputation.

### Who Benefits

- **Visitors** see the strongest arguments for each side immediately, without scrolling through noise.
- **Participants** get meaningful feedback on their contributions — not just vote counts, but *why* their arguments resonated.
- **Neutral observers** have a dedicated view showing only their cohort's assessment, producing the platform's most credible signal.
- **Researchers/admins** get rich engagement data that can be correlated with surveys to understand how argumentative patterns relate to broader beliefs.

---

## 2. System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                             │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌─────────┐ ┌──────────┐ │
│  │  Thread   │ │  Sides   │ │   Best    │ │ Neutral │ │Analytics │ │
│  │  View     │ │  View    │ │ Exchanges │ │ Verdict │ │   View   │ │
│  └─────┬────┘ └─────┬────┘ └─────┬─────┘ └────┬────┘ └─────┬────┘ │
│        │            │            │             │            │       │
│        └────────────┴────────────┴─────────────┴────────────┘       │
│                              │                                      │
│                     View Switcher (tabs)                             │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────┴───────────────────────────────────────┐
│                      SITE INSTANCE (Next.js 16)                     │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐ │
│  │  App Router   │  │  API Routes  │  │  Background Jobs          │ │
│  │  (SSR/RSC)    │  │  /api/*      │  │  - Stance detection       │ │
│  │               │  │              │  │  - Score computation      │ │
│  │  React 19     │  │  Auth.js v5  │  │  - Reputation sync        │ │
│  │  Tailwind v4  │  │  Drizzle ORM │  │  - Engagement fingerprint │ │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────────┘ │
│         │                 │                       │                  │
│         └─────────────────┴───────────────────────┘                  │
│                           │                                          │
│              ┌────────────┴────────────┐                             │
│              │                         │                             │
│         ┌────▼─────┐            ┌──────▼──────┐                     │
│         │PostgreSQL│            │    Redis     │                     │
│         │  16+     │            │    7+        │                     │
│         │          │            │              │                     │
│         │ Comments │            │ Ranked lists │                     │
│         │ Votes    │            │ Verdict tally│                     │
│         │ Stances  │            │ Session cache│                     │
│         │ Users    │            │              │                     │
│         └──────────┘            └──────────────┘                     │
└──────────────────────────────────────────────────────────────────────┘
                              │
                         (Phase 3)
                              │ HTTPS (Federation API)
┌─────────────────────────────┴──────────────────────────────┐
│                     AGORA HUB (Lightweight)                 │
│                                                             │
│  Identity (OIDC) │ Reputation Index │ Site Registry          │
│                                                             │
│  Does NOT store content. Only identity + reputation scores. │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Summary

1. **User posts a comment** → stored in PostgreSQL with stance, depth, and materialized ancestor path
2. **User votes with a reason** → stored in PostgreSQL; triggers Redis cache invalidation for affected rankings
3. **Background jobs** periodically recompute: weighted scores, exchange pair rankings, algorithmic stance detection, engagement fingerprints
4. **Views query different projections** of the same data: Thread View reads chronologically, Sides View reads by stance+score, Best Exchanges reads paired high-scoring opposites, Neutral Verdict reads only neutral-cohort votes
5. **SSE stream** pushes live verdict tally updates to connected clients
6. **Federation sync** (Phase 3) periodically pushes reputation snapshots to the Hub; sites cache cross-site reputation locally

---

## 3. Technology Stack

| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Framework | Next.js (App Router) | 16.x | SSR/SSG for SEO (public debate content must be indexable), React 19 Server Components, built-in API routes |
| Language | TypeScript (strict mode) | 5.x | Type safety across complex data model with many enums and relationships |
| Database | PostgreSQL | 16+ | Relational integrity for comment trees, GIN indexes for materialized path arrays, JSONB for engagement fingerprints |
| ORM | Drizzle ORM | drizzle-kit 0.31.x | Lightweight, type-safe, builder-style schema (`t.uuid().defaultRandom()`), built-in `drizzle-seed`, good migration tooling |
| Cache | Redis | 7+ | Computed rankings, verdict tallies, session data. 60s TTL for view caches prevents DB hammering |
| Auth | Auth.js v5 (next-auth) | 5.x | `@auth/drizzle-adapter` for native Drizzle integration, OAuth (Google, GitHub) + credentials, simplified env var convention |
| Rich Text | TipTap | @tiptap/react | ProseMirror-based, extensible for citation embedding. Must use `immediatelyRender: false` for Next.js SSR |
| Styling | Tailwind CSS v4 + shadcn/ui | v4 / v3.5+ | CSS-first `@theme` config, no JS config file. shadcn provides accessible component primitives |
| Virtualization | TanStack Virtual | v3 | Headless virtualizer for long comment trees — only renders visible items |
| Real-time | Server-Sent Events | native | One-directional live updates (verdict tallies). Simpler than WebSockets for this use case |
| Search | Meilisearch | Phase 3 | Full-text search across debates, cross-site search index |
| OIDC | panva/node-oidc-provider | latest | OpenID Certified. Hub acts as OIDC provider for cross-site SSO |
| Monorepo | Turborepo + pnpm | latest | shadcn CLI scaffolds monorepo natively. Workspace structure: `packages/site`, `packages/shared`, `packages/hub` |
| Testing | Vitest + Playwright | latest | Unit tests for algorithms, E2E for user flows |

---

## 4. System Architecture

### 4.1 Monorepo Structure

```
christian-debate/
├── packages/
│   ├── site/                       # Main platform (Next.js 16)
│   │   ├── src/
│   │   │   ├── app/                # Next.js App Router pages
│   │   │   │   ├── (auth)/         # Login, register routes
│   │   │   │   ├── d/[slug]/       # Debate pages (all views)
│   │   │   │   ├── u/[username]/   # User profiles
│   │   │   │   ├── debates/        # Browse/search debates
│   │   │   │   ├── moderation/     # Mod dashboard
│   │   │   │   ├── settings/       # User settings
│   │   │   │   └── api/            # API route handlers
│   │   │   ├── components/         # React components (see §11)
│   │   │   ├── lib/                # Business logic
│   │   │   │   ├── auth/           # Auth.js config + OIDC client
│   │   │   │   ├── views/          # View query builders
│   │   │   │   ├── votes/          # Vote computation logic
│   │   │   │   ├── federation/     # Federation client (Hub API calls)
│   │   │   │   └── jobs/           # Background job definitions
│   │   │   └── db/
│   │   │       ├── schema.ts       # Drizzle schema (all tables)
│   │   │       ├── seed.ts         # Seed script
│   │   │       └── migrations/     # Drizzle migrations
│   │   ├── drizzle.config.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── hub/                        # Hub service (Phase 3)
│   │   ├── src/
│   │   │   ├── app/                # Hub admin pages, OIDC endpoints
│   │   │   ├── lib/
│   │   │   │   ├── oidc/           # OIDC provider config
│   │   │   │   ├── federation/     # Federation API handlers
│   │   │   │   └── reputation/     # Aggregation algorithms
│   │   │   └── db/
│   │   │       ├── schema.ts       # Hub-specific schema
│   │   │       └── migrations/
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── shared/                     # Shared between site + hub
│       ├── types/                  # TypeScript types
│       ├── federation-protocol/    # API contracts, HMAC signing
│       ├── reputation/             # Shared scoring algorithms
│       └── package.json
│
├── docker-compose.yml              # Dev: Postgres + Redis
├── docker-compose.prod.yml         # Prod: Hub + sites + infra
├── turbo.json                      # Turborepo config
├── docs/
│   ├── architecture.md             # This document
│   ├── initial_conversation.txt    # Original spec discussion
│   └── prd.md                      # Product requirements
└── package.json                    # Workspace root
```

### 4.2 Request Flow

```
Browser Request
      │
      ▼
┌─────────────────────┐
│  Next.js App Router  │
│  (Server Components) │
│                      │
│  SSR for SEO:        │
│  - Debate pages      │
│  - User profiles     │
│  - Comment threads   │
└──────────┬──────────┘
           │
     ┌─────┴──────┐
     │             │
     ▼             ▼
  Page render   API call
  (RSC + SSR)   (/api/*)
     │             │
     │      ┌──────┴──────┐
     │      │ Auth.js v5  │
     │      │ middleware   │
     │      └──────┬──────┘
     │             │
     └──────┬──────┘
            │
     ┌──────┴──────┐
     │ Drizzle ORM │
     └──────┬──────┘
            │
     ┌──────┴──────────────┐
     │                      │
     ▼                      ▼
  PostgreSQL             Redis
  (source of truth)      (cached rankings)
```

### 4.3 Key Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Comment tree storage | Materialized path (`ancestorPath` uuid[]) | O(1) ancestor chain lookup for the Compressed Ancestor Trail. GIN-indexed for fast queries |
| View rendering | Same data, different queries + sort orders | No data duplication. Views are query projections, not separate tables |
| Ranking cache | Redis with 60s TTL | Sides View and Best Exchanges sort by computed scores. Recomputing per-request would crush the DB |
| Real-time updates | SSE (not WebSockets) | Verdict tallies are one-directional server→client. SSE is simpler, sufficient, and has better proxy compatibility |
| Comment depth | Flatten visually at depth 6+ | Prevents extreme horizontal scrolling on mobile while preserving logical nesting |
| Stance honesty | Algorithmic detection (not user reports) | "Leans Pro based on activity" is transparent and non-adversarial. User-driven "dishonest" flags would be weaponized |
| Federation model | Hub-and-Spoke (not peer-to-peer) | Simpler trust boundary than ActivityPub. Single Hub handles identity + reputation index. Sites never talk directly |
| Content residency | Content never leaves originating site | Hub only receives computed reputation snapshots (numbers), never comment text or votes. GDPR-friendly |
| Mobile strategy | Mobile-first responsive web (not native apps) | PWA for mobile. Content-heavy SEO platform — Flutter/native would sacrifice indexability |

---

## 5. Data Model

### 5.1 Entity Relationship Diagram

```
┌──────────┐       ┌───────────────┐       ┌──────────┐
│  User    │──────<│ DebateStance  │>──────│  Debate  │
│          │  1:M  │               │  M:1  │          │
│ id       │       │ declaredStance│       │ id       │
│ username │       │ algorithmLean │       │ title    │
│ email    │       │ leanConfidence│       │ slug     │
│ trustTier│       └───────────────┘       │ sideA    │
│ repScore │                               │ sideB    │
└────┬─────┘                               │ status   │
     │                                     └────┬─────┘
     │ 1:M                                      │ 1:M
     ▼                                          ▼
┌──────────┐                              ┌──────────┐
│ Comment  │──────────────────────────────>│ Comment  │
│          │  parentId (self-referential)  │ (parent) │
│ id       │                              └──────────┘
│ debateId │
│ authorId │       ┌──────────┐
│ parentId │──────<│  Vote    │
│ rootId   │  1:M  │          │
│ depth    │       │ direction│
│ content  │       │ reason   │
│ stanceSide│      │ weight   │
│ ancestorPath│    │ userId   │
│ isQuarantined│   └──────────┘
│ score    │
└────┬─────┘
     │ 1:M
     ▼
┌──────────────────┐     ┌──────────────┐     ┌──────────────┐
│ ArgumentTag      │     │ StanceShift  │     │ VerdictVote  │
│                  │     │              │     │              │
│ taxonomy (enum)  │     │ fromStance   │     │ winningSide  │
│ taggedBy         │     │ toStance     │     │ voterStance  │
│                  │     │ triggeredBy  │     │ pinnedComment│
└──────────────────┘     └──────────────┘     └──────────────┘

                    ┌─────────────────────┐
                    │ BurdenOfProofRequest │
                    │                     │
                    │ commentId           │
                    │ flagCount           │
                    │ status              │
                    │ citationUrl         │
                    └─────────────────────┘
```

### 5.2 Core Tables

#### Users

```
users
├── id: uuid (PK, default random)
├── username: varchar (unique, not null)
├── displayName: varchar (not null)
├── email: varchar (unique, not null)
├── passwordHash: varchar (nullable — null for OAuth-only users)
├── avatarUrl: varchar (nullable)
├── trustTier: enum [new, established, trusted, moderator, admin] (default: new)
├── reputationScore: integer (default: 0, computed by background job)
├── persuasionRating: integer (default: 0, count of changed_my_mind votes received)
├── engagementFingerprint: jsonb (nullable, computed async — Phase 3)
├── createdAt: timestamp (default: now)
└── updatedAt: timestamp (default: now)
```

**Trust tier progression:**

| Tier | Criteria | Privileges |
|---|---|---|
| `new` | Account < 7 days OR < 5 comments | Rate-limited posting. Votes don't count toward Verdict |
| `established` | 7+ days AND 10+ comments with net positive score | Full voting weight. Can tag argument taxonomy |
| `trusted` | 30+ days AND high reputation AND low quarantine rate | Can vote on mod appeals. 1.5x vote weight in analytics |
| `moderator` | Appointed by admin | Resolve quarantine appeals, lock threads, edit debate metadata |
| `admin` | Platform owner | Full access |

#### Debates

```
debates
├── id: uuid (PK)
├── title: varchar (not null)
├── slug: varchar (unique, not null)
├── description: text (rich text)
├── createdBy: uuid → users (not null)
├── sideALabel: varchar (not null, e.g., "Pro", "For Legalization")
├── sideBLabel: varchar (not null, e.g., "Con", "Against Legalization")
├── status: enum [open, locked, archived] (default: open)
├── tags: varchar[] (array)
├── createdAt: timestamp
└── updatedAt: timestamp
```

#### Debate Stances

```
debate_stances
├── id: uuid (PK)
├── debateId: uuid → debates (not null)
├── userId: uuid → users (not null)
├── declaredStance: enum [side_a, side_b, neutral] (not null)
├── algorithmicLean: enum [side_a, side_b, neutral, mixed] (computed)
├── leanConfidence: real (0.0–1.0, computed)
├── previousStance: enum (nullable — tracks most recent shift)
├── declaredAt: timestamp
├── changedAt: timestamp (nullable)
└── UNIQUE(debateId, userId)
```

#### Comments

```
comments
├── id: uuid (PK)
├── debateId: uuid → debates (not null)
├── authorId: uuid → users (not null)
├── parentId: uuid → comments (nullable — null = top-level)
├── rootId: uuid → comments (not null — top-level ancestor, for thread grouping)
├── depth: integer (0 = top-level)
├── content: text (rich text / markdown, not null)
├── stanceSide: enum [side_a, side_b, neutral, meta] (not null)
│   (meta = procedural comments about the debate itself)
├── ancestorPath: uuid[] (materialized path — full chain of parent IDs)
├── isQuarantined: boolean (default: false)
├── quarantineReason: varchar (nullable)
├── status: enum [active, edited, deleted_by_author, removed_by_mod] (default: active)
├── score: integer (default: 0, precomputed weighted aggregate)
├── createdAt: timestamp
└── editedAt: timestamp (nullable)
```

**Why `ancestorPath`?** This is the key to the Compressed Ancestor Trail. When a user clicks into a deep comment, the UI needs the full chain of parents instantly. With a materialized path array, this is a single column read — no recursive CTE needed. The array is maintained on INSERT by appending `parentId` to the parent's `ancestorPath`.

#### Votes

```
votes
├── id: uuid (PK)
├── commentId: uuid → comments (not null)
├── userId: uuid → users (not null)
├── direction: enum [up, down] (not null)
├── reason: enum [see §7] (not null)
├── weight: real (computed from user trustTier: new=0.5, established=1.0, trusted=1.5)
├── createdAt: timestamp
└── UNIQUE(commentId, userId) — one vote per user per comment; re-voting replaces previous
```

#### Stance Shifts (Delta Events)

```
stance_shifts
├── id: uuid (PK)
├── debateId: uuid → debates
├── userId: uuid → users
├── fromStance: enum [side_a, side_b, neutral]
├── toStance: enum [side_a, side_b, neutral]
├── triggeredByCommentId: uuid → comments (nullable)
├── shiftedAt: timestamp
└── note: text (nullable — user's optional explanation)
```

#### Verdict Votes

```
verdict_votes
├── id: uuid (PK)
├── debateId: uuid → debates
├── voterId: uuid → users
├── winningSide: enum [side_a, side_b, draw]
├── voterStance: enum (snapshot of their stance at vote time)
├── pinnedCommentId: uuid → comments (nullable — the comment they attribute to winning)
├── createdAt: timestamp
└── UNIQUE(debateId, voterId)
```

#### Argument Tags

```
argument_tags
├── id: uuid (PK)
├── commentId: uuid → comments
├── taxonomy: enum [empirical, moral_ethical, economic, procedural, anecdotal, legal, historical]
├── taggedBy: uuid → users
└── createdAt: timestamp
```

#### Burden of Proof Requests

```
burden_of_proof_requests
├── id: uuid (PK)
├── commentId: uuid → comments (unique)
├── flagCount: integer (default: 0)
├── status: enum [pending, citation_provided, upheld, dismissed]
├── citationUrl: varchar (nullable)
├── citationUpvotes: integer (default: 0)
├── createdAt: timestamp
└── resolvedAt: timestamp (nullable)
```

#### Federated Identity (Phase 3 placeholder)

```
federated_identity
├── id: uuid (PK)
├── localUserId: uuid → users (unique)
├── hubUserId: uuid (the global ID from the Hub)
├── linkedAt: timestamp
└── syncedAt: timestamp (last reputation sync)
```

### 5.3 Database Indexes

```sql
-- Thread view: fetch all comments for a debate in chronological order
CREATE INDEX idx_comments_debate_created ON comments(debate_id, created_at);

-- Sides view: filter by debate + stance, sort by score
CREATE INDEX idx_comments_debate_stance ON comments(debate_id, stance_side);

-- Vote aggregation
CREATE INDEX idx_votes_comment ON votes(comment_id);
CREATE UNIQUE INDEX idx_votes_user_comment ON votes(user_id, comment_id);

-- Ancestor trail: fast lookup of parent chain
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_comments_ancestor_path ON comments USING GIN(ancestor_path);

-- Stance lookups
CREATE UNIQUE INDEX idx_stances_debate_user ON debate_stances(debate_id, user_id);
CREATE INDEX idx_stances_debate_declared ON debate_stances(debate_id, declared_stance);

-- Verdict tallies
CREATE INDEX idx_verdict_debate ON verdict_votes(debate_id);

-- User profile queries
CREATE INDEX idx_comments_author ON comments(author_id);
CREATE INDEX idx_stance_shifts_debate ON stance_shifts(debate_id, shifted_at);
```

---

## 6. The View System

The view system is the core product differentiator. All views render the **same underlying comment data** through different query and presentation layers. No data is duplicated — views are query projections.

### 6.1 Thread View (Default)

**Purpose:** Chronological discussion as it happened, with context preservation.

**URL:** `/d/[slug]` or `/d/[slug]?view=thread`

**How it works:**
- Standard nested comment tree, indented by depth
- **Compressed Ancestor Trail**: sticky bar at the top of the viewport showing the chain of parent comments when the user scrolls deep. Each ancestor shows: author name, stance badge, first ~80 characters, clickable to scroll/expand in place. Rendered from `comment.ancestorPath`.
- Comments beyond depth 6 flatten visually (no further indentation) but maintain logical nesting
- No pagination to new pages — infinite scroll with TanStack Virtual windowing
- Collapse/expand controls per subtree

**Key query:**
```sql
SELECT c.*, u.username, u.avatar_url,
       ds.declared_stance, ds.algorithmic_lean
FROM comments c
JOIN users u ON c.author_id = u.id
LEFT JOIN debate_stances ds
  ON ds.debate_id = c.debate_id AND ds.user_id = c.author_id
WHERE c.debate_id = :debateId AND c.status = 'active'
ORDER BY c.created_at ASC
```

### 6.2 Sides View

**Purpose:** Discovery surface — see the strongest arguments for each side without digging.

**URL:** `/d/[slug]?view=sides`

**Layout:**
- Desktop: two columns (Side A left, Side B right), toggleable Neutral section
- Mobile: tab bar [Side A | Side B | Neutral]
- Each card shows: author, stance badge, ~200 chars, vote breakdown by reason
- "View in Context" → navigates to Thread View, scrolls to comment, highlights it

**Key query (per side):**
```sql
SELECT c.*,
  SUM(CASE
    WHEN v.direction = 'up' AND v.reason = 'changed_my_mind' THEN 3 * v.weight
    WHEN v.direction = 'up' AND v.reason = 'well_sourced' THEN 2 * v.weight
    WHEN v.direction = 'up' THEN 1 * v.weight
    WHEN v.direction = 'down' THEN -1 * v.weight
    ELSE 0
  END) as weighted_score
FROM comments c
LEFT JOIN votes v ON v.comment_id = c.id
WHERE c.debate_id = :debateId
  AND c.stance_side = :side
  AND c.status = 'active'
GROUP BY c.id
ORDER BY weighted_score DESC
LIMIT :pageSize OFFSET :offset
```

**Caching:** Result cached in Redis with 60s TTL, invalidated on new votes.

### 6.3 Best Exchanges View

**Purpose:** Surface the strongest back-and-forth dialogues where both sides performed well.

**URL:** `/d/[slug]?view=exchanges`

**Algorithm:**
1. Find all comment pairs where B is a direct reply to A, A and B have opposing `stanceSide`, and both have `score` above the 75th percentile for the debate
2. Score each pair: `pair_score = min(A.score, B.score) * 2 + max(A.score, B.score)`
   - This formula **favors balanced exchanges** over one-sided blowouts
3. Extend to chains: if B's reply C also scores well and opposes B, present as a 3-part exchange
4. Results cached in Redis, recomputed by background job

**Layout:** Paired cards side-by-side (desktop) or stacked with visual connectors (mobile). Each links to full thread context.

### 6.4 Neutral Verdict View

**Purpose:** What the self-declared neutral observers think — the platform's most credible signal.

**URL:** `/d/[slug]?view=verdict`

**Layout:**
- Hero section: large tally bar — Side A winning / Side B winning / Draw — updated live via SSE
- Below: comments that Neutral users pinned as decisive, sorted by pin count
- Stats panel: total neutral voters, percentage of "verified neutrals" (algorithmic lean is neutral/mixed with confidence < 0.3)
- "Verified Neutrals only" filter — excludes declared-neutral users whose behavior algorithmically leans strongly to one side

**SSE endpoint:** `GET /api/debates/[slug]/verdict/stream`

### 6.5 Analytics View (Phase 3)

**Purpose:** Dashboard for debate-level and platform-level metrics.

**Displays:** Stance distribution over time (line chart), vote reason breakdown, persuasion leaderboard, argument taxonomy distribution, engagement depth histogram, cohort snapshots.

---

## 7. Reasoned Voting System

Every vote requires a reason. This is the platform's strongest analytical asset.

### 7.1 Vote Categories

**Upvote reasons:**

| Reason | Signal | Weight multiplier |
|---|---|---|
| `well_reasoned` | Logically structured argument | 1x |
| `well_sourced` | Backed by evidence/citations | 2x |
| `changed_my_mind` | Shifted the voter's thinking | 3x (highest value signal) |
| `strong_counterpoint` | Effectively challenges opposing argument | 1x |
| `well_written` | Clear, engaging expression | 1x |

**Downvote reasons:**

| Reason | Signal | Weight multiplier |
|---|---|---|
| `off_topic` | Not relevant to debate | -1x |
| `uncivil` | Ad hominem, hostile | -1x (triggers quarantine at threshold) |
| `misleading_unsourced` | Claims without support | -1x (triggers Burden of Proof at threshold) |
| `misrepresented_stance` | Comment contradicts declared stance | -1x |
| `low_effort` | Does not contribute meaningfully | -1x |

### 7.2 Score Computation

```
weighted_score = Σ (direction_multiplier × reason_weight × user_trust_weight)

where:
  direction_multiplier = +1 (up) or -1 (down)
  reason_weight = see table above (1x, 2x, or 3x)
  user_trust_weight = 0.5 (new) | 1.0 (established) | 1.5 (trusted+)
```

Scores are precomputed by a background job and cached in Redis. The `comments.score` column stores the latest value for use in SQL ORDER BY clauses.

### 7.3 Burden of Proof Mechanic

When a comment accumulates **3+ `misleading_unsourced` downvotes**:

1. System pins a "Citation Requested" notice to the comment
2. Author is notified and can add a source URL
3. If citation is provided and receives 3+ `well_sourced` upvotes, the `misleading_unsourced` downvotes are neutralized
4. If no citation is provided within 72 hours, comment is labeled "Unsupported Claim" and downvotes remain at full weight

```
State machine:

  [No flags] ──3+ unsourced downvotes──> [Pending]
  [Pending] ──author adds citation──> [Citation Provided]
  [Citation Provided] ──3+ well_sourced upvotes──> [Upheld] (penalties reversed)
  [Citation Provided] ──insufficient upvotes after 72h──> [Dismissed]
  [Pending] ──72h no citation──> [Dismissed] (labeled "Unsupported Claim")
```

---

## 8. Moderation & Trust

### 8.1 Quarantine System

Comments are auto-quarantined (collapsed with warning label, **never deleted**) when:
- 5+ `uncivil` downvotes in the first 10 minutes
- Account in `new` trust tier and content matches spam patterns

Quarantined comments display: *"This comment has been collapsed due to community flags. [Click to read] [Appeal]"*

The comment's votes are **excluded from computed rankings** while quarantined, but the content is preserved for transparency. No censorship — just re-prioritization.

### 8.2 Algorithmic Stance Detection

Instead of letting users punish each other for "dishonest stance," the system detects it algorithmically and displays the evidence transparently.

```
For each user in a debate:
  a_signals = comments with stanceSide=side_a + upvotes given to side_a comments
  b_signals = comments with stanceSide=side_b + upvotes given to side_b comments
  total = a_signals + b_signals

  if total < 5: lean = 'mixed', confidence = 0 (insufficient data)
  else:
    lean_score = (a_signals - b_signals) / total    // range: -1 to +1
    if lean_score > 0.4:  lean = 'side_a'
    elif lean_score < -0.4: lean = 'side_b'
    else: lean = 'mixed'
    confidence = abs(lean_score)
```

**Display rule:** Only show "Leans [Side] based on activity" badge when:
- User's `declaredStance` is `neutral`
- AND `leanConfidence > 0.5`

This removes the adversarial dynamic of user-driven "dishonest" flags entirely.

---

## 9. Computed Systems & Background Jobs

These run asynchronously, not on the request path.

| Job | Trigger | Output | Frequency |
|---|---|---|---|
| **Score computation** | New vote event | `comments.score`, Redis ranked lists | On vote (debounced 5s) |
| **Exchange pairing** | Score change | Redis sorted set of exchange pairs | Every 5 min per active debate |
| **Algorithmic stance** | New comment/vote | `debate_stances.algorithmicLean` + `leanConfidence` | Every 15 min per active debate |
| **Trust tier promotion** | Daily | `users.trustTier` upgrades | Daily at midnight |
| **Burden of Proof timeout** | Hourly | Expire pending requests after 72h | Hourly |
| **Verdict tally** | New verdict vote | Redis hash, SSE broadcast | On vote (immediate) |
| **Reputation score** | Daily | `users.reputationScore`, `users.persuasionRating` | Daily |
| **Engagement fingerprint** | Weekly | `users.engagementFingerprint` (JSONB) | Weekly (Phase 3) |
| **Reputation sync** | Every 6 hours | Push snapshots to Hub | 6 hours (Phase 3) |
| **Cohort snapshot** | Weekly | Frozen debate state for time-series | Weekly (Phase 3) |

---

## 10. API Design

### 10.1 Route Structure

```
/api/
├── auth/                         # Auth.js handlers (GET, POST)
│
├── debates/
│   ├── GET    /                   # List debates (paginated, filterable by tags/status)
│   ├── POST   /                   # Create debate (authenticated)
│   ├── GET    /[slug]             # Get debate with metadata
│   ├── PATCH  /[slug]             # Update debate (mod/admin)
│   │
│   ├── GET    /[slug]/comments
│   │   ?view=thread               # Thread view (default)
│   │   ?view=sides&side=a         # Sides view, filtered
│   │   ?view=exchanges            # Best exchanges
│   │   ?sort=score|recent|controversial
│   │   ?page=1&limit=50
│   ├── POST   /[slug]/comments    # Post comment (with stanceSide)
│   │
│   ├── GET    /[slug]/verdict     # Verdict tallies (by voter stance cohort)
│   ├── POST   /[slug]/verdict     # Cast verdict vote
│   ├── GET    /[slug]/verdict/stream  # SSE for live tally updates
│   │
│   ├── GET    /[slug]/stances     # Stance distribution
│   ├── POST   /[slug]/stances     # Declare/change stance
│   │
│   └── GET    /[slug]/analytics   # Debate analytics (Phase 3)
│
├── comments/
│   ├── GET    /[id]               # Single comment with vote breakdown
│   ├── PATCH  /[id]               # Edit comment (author only)
│   ├── DELETE /[id]               # Soft delete (author or mod)
│   ├── POST   /[id]/vote          # Vote with reason
│   ├── GET    /[id]/context       # Comment + full ancestor chain + siblings
│   ├── POST   /[id]/tag           # Add argument taxonomy tag
│   └── POST   /[id]/burden-of-proof  # Respond to citation request
│
├── users/
│   ├── GET    /[username]         # Public profile
│   ├── GET    /[username]/stats   # Engagement stats
│   └── GET    /me                 # Authenticated user profile
│
├── moderation/
│   ├── GET    /queue              # Quarantined comments
│   ├── POST   /[commentId]/resolve  # Resolve quarantine (mod)
│   └── POST   /[commentId]/appeal   # User appeal
│
└── federation/                    # Phase 3
    ├── GET    /user/:id/reputation
    ├── GET    /user/:id/highlights
    └── GET    /stats
```

### 10.2 Key Request/Response Examples

**Post a comment:**
```
POST /api/debates/should-ai-be-regulated/comments
Authorization: Bearer <session-token>

{
  "parentId": "uuid-or-null",
  "content": "<p>Rich text content...</p>",
  "stanceSide": "side_a"
}

→ 201 Created
{
  "id": "new-comment-uuid",
  "debateId": "...",
  "authorId": "...",
  "parentId": "...",
  "depth": 3,
  "ancestorPath": ["root-uuid", "parent-uuid", "grandparent-uuid"],
  "stanceSide": "side_a",
  "score": 0,
  "createdAt": "2026-03-05T..."
}
```

**Vote with reason:**
```
POST /api/comments/comment-uuid/vote
Authorization: Bearer <session-token>

{
  "direction": "up",
  "reason": "changed_my_mind"
}

→ 200 OK
{
  "commentId": "...",
  "newScore": 42,
  "voteBreakdown": {
    "well_reasoned": 5,
    "well_sourced": 3,
    "changed_my_mind": 2,
    "off_topic": 1
  }
}
```

---

## 11. Frontend Architecture

### 11.1 Component Hierarchy

```
components/
├── debate/
│   ├── DebatePage.tsx              # Main container, orchestrates views
│   ├── ViewSwitcher.tsx            # Tab bar: Thread | Sides | Exchanges | Verdict
│   ├── StanceDeclaration.tsx       # Modal for choosing Pro/Con/Neutral
│   └── VerdictBar.tsx              # Live tally hero component (SSE-connected)
│
├── comments/
│   ├── CommentTree.tsx             # Recursive nested thread renderer
│   ├── CommentCard.tsx             # Single comment: content + votes + badges
│   ├── AncestorTrail.tsx           # Sticky breadcrumb of parent chain
│   ├── CompactCommentPreview.tsx   # Truncated card for Sides view (~200 chars)
│   └── ExchangePair.tsx            # Paired Pro/Con cards for Exchanges view
│
├── voting/
│   ├── VoteButton.tsx              # Up/down toggle
│   ├── ReasonPicker.tsx            # Dropdown for selecting vote reason
│   ├── VoteBreakdown.tsx           # Visual breakdown of vote reasons
│   └── BurdenOfProof.tsx           # Citation request notice + response flow
│
├── user/
│   ├── StanceBadge.tsx             # Pro/Con/Neutral badge (+ "Leans X" indicator)
│   ├── TrustBadge.tsx              # Trust tier indicator
│   └── UserProfileCard.tsx         # Hover card with stats
│
├── editor/
│   ├── CommentEditor.tsx           # TipTap rich text editor ('use client')
│   ├── CitationEmbed.tsx           # Inline source/link embedding
│   └── StancePicker.tsx            # Which side is this comment arguing for?
│
└── analytics/                      # Phase 3
    ├── StanceTimeline.tsx          # Stance shifts over time
    ├── VoteReasonChart.tsx         # Reason type breakdown
    ├── PersuasionLeaderboard.tsx   # Top persuaders
    └── TaxonomyBreakdown.tsx       # Argument type distribution
```

### 11.2 Page Structure

```
/                               # Landing: featured debates, trending
/debates                        # Browse/search all debates
/debates/new                    # Create debate form
/d/[slug]                       # Debate page (main experience)
  ?view=thread                  # Default thread view
  ?view=sides                   # Sides view
  ?view=exchanges               # Best exchanges
  ?view=verdict                 # Neutral verdict view
  ?view=analytics               # Analytics dashboard (Phase 3)
/d/[slug]/comment/[id]          # Deep-link to specific comment in context
/u/[username]                   # User profile + stats + debate history
/moderation                     # Mod dashboard
/settings                       # User settings, notification prefs
```

### 11.3 Client/Server Component Strategy (Next.js 16)

| Component | Rendering | Reason |
|---|---|---|
| DebatePage, CommentTree (outer) | Server Component | SEO: debate content must be indexable |
| CommentEditor (TipTap) | `'use client'` | Browser-only rich text editor |
| VoteButton, ReasonPicker | `'use client'` | Interactive, requires client state |
| AncestorTrail | `'use client'` | Requires scroll position tracking |
| VerdictBar | `'use client'` | SSE connection for live updates |
| ViewSwitcher | `'use client'` | URL query param manipulation |
| StanceBadge, TrustBadge | Server Component | Static display, no interactivity |
| UserProfileCard | Server Component | Static data, SSR for SEO |

---

## 12. Federation Architecture

### 12.1 Hub and Spoke Model

```
                    ┌─────────────────────┐
                    │     Agora Hub        │
                    │  (Identity + Index)  │
                    │                      │
                    │  - OIDC Provider     │
                    │  - User identity     │
                    │  - Profile links     │
                    │  - Reputation index  │
                    │  - Site registry     │
                    └──────┬──────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼──┐   ┌────▼───┐   ┌───▼─────┐
        │ Site A  │   │ Site B │   │ Site C  │
        │theology │   │ethics  │   │ policy  │
        │         │   │        │   │         │
        │ Own DB  │   │ Own DB │   │ Own DB  │
        │Own admin│   │Own admin│  │Own admin│
        └─────────┘   └────────┘   └─────────┘
```

### 12.2 What the Hub Stores (and Doesn't)

**Hub stores:**
- Global user identities (email, display name, avatar)
- Profile link registry (which site-local accounts belong to the same person)
- Aggregated reputation snapshots (numbers only — reputation score, debates participated, minds changed)
- Site registry (name, URL, niche, trust status)
- SSO tokens

**Hub does NOT store:**
- Comment content
- Vote data
- Debate content
- Raw engagement data

Content never leaves the originating site.

### 12.3 SSO Flow

```
User visits Site B → "Sign in with Agora" →
  Redirect to Hub OIDC /oauth/authorize →
    Hub checks session (or prompts login) →
      Hub returns authorization code →
        Site B exchanges code for ID token →
          Site B creates local account + FederatedIdentity link →
            User is logged in on Site B
```

Users can always create purely local accounts. Hub linking is opt-in.

### 12.4 Reputation Aggregation

Global reputation uses **diminishing returns** to prevent gaming:

```
global_score = Σ (local_score × position_weight × site_trust × engagement_depth)

where:
  position_weight = 1.0 / (1 + 0.5 × rank)  // site 1: 1.0, site 2: 0.6, site 3: 0.4
  site_trust = 1.0 (verified) | 0.5 (pending) | 0.0 (suspended)
  engagement_depth = min(debates_participated / 10, 1.0)
```

Sites sorted by local_score DESC before aggregation. This means your strongest community contribution matters most — you can't inflate global score by farming easy reputation on low-activity sites.

### 12.5 Privacy Controls

| Setting | Options | Default |
|---|---|---|
| Profile link visibility | Public / Mutual / Private | **Private** |
| Show cross-site reputation | Yes / No | Yes (if linked) |
| Show cross-site comment highlights | Yes / No | **No** |
| Share engagement fingerprint | Yes / No | **No** |

**Graceful degradation:** Hub goes down → sites keep working, show stale cross-site data (or nothing). Site never joins network → fully functional standalone platform.

---

## 13. Analytics & Correlation Engine

### 13.1 Engagement Fingerprinting (Phase 3)

For each user, a background job computes a profile vector stored as JSONB:

```json
{
  "debatesEngaged": 12,
  "avgStance": 0.3,
  "stanceConsistency": 0.7,
  "mindChangeRate": 0.15,
  "argumentStyleWeights": {
    "empirical": 0.4,
    "moral": 0.2,
    "economic": 0.3,
    "anecdotal": 0.1
  },
  "engagementDepth": "deep",
  "persuasionScore": 42,
  "upvoteReasonProfile": {
    "well_reasoned": 0.5,
    "well_sourced": 0.3,
    "changed_my_mind": 0.1,
    "well_written": 0.1
  }
}
```

### 13.2 Survey Correlation

The ultimate analytics play: correlate engagement fingerprints with survey responses.

- Create surveys linked to specific debates
- Survey responses are tied to the user's engagement fingerprint
- Correlation engine cross-references: stance positions, argument style weights, vote patterns, mind-change history
- Output: "Users who primarily respond to *economic* arguments in the tax debate overwhelmingly support Candidate Y, whereas those swayed by *moral* arguments support Candidate Z"
- Cross-site correlations (with user opt-in): correlate stances across theology AND policy debates with survey responses

### 13.3 Cohort Snapshots

Periodic snapshots of debate state for time-series analysis:
- Who's winning according to Neutrals at time T
- What the top arguments are at time T
- How stances have shifted over the past week

---

## 14. Security

### 14.1 Application Security

- **Auth:** Auth.js v5 with JWT strategy, secure httpOnly cookies
- **CSRF:** Built-in via Auth.js
- **Input sanitization:** Rich text content sanitized server-side before storage (strip dangerous HTML)
- **Rate limiting:** New accounts rate-limited on posting and voting
- **SQL injection:** Prevented by Drizzle ORM parameterized queries (never raw string interpolation)

### 14.2 Federation Security

- **Site-to-Hub auth:** Every request includes:
  - `X-Agora-Site-Id` (registered UUID)
  - `X-Agora-Signature` (HMAC-SHA256 of request body using site's API key)
  - `X-Agora-Timestamp` (reject if >5 minutes old — replay prevention)
- **User impersonation prevention:** Hub verifies `hubUserId` has active `ProfileLink` to requesting site
- **Rogue site mitigation:** Hub admin can suspend sites, immediately excluding their data from all aggregations
- **Reputation bounds:** Rate limiting prevents a site from suddenly granting a user 999,999 reputation

---

## 15. Deployment

### 15.1 Development (Docker Compose)

```yaml
services:
  postgres:
    image: postgres:16
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]
    environment:
      POSTGRES_DB: christian_debate
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

Site runs locally via `pnpm dev` connecting to Docker services.

### 15.2 Production — Single Operator

```
┌──────────────────────────────────────────┐
│  VPS / Cloud Instance                     │
│                                           │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐ │
│  │ Hub      │  │ Site A  │  │ Site B   │ │
│  │ :3000    │  │ :3001   │  │ :3002    │ │
│  └────┬─────┘  └────┬────┘  └────┬─────┘ │
│       │              │            │       │
│  ┌────▼──────────────▼────────────▼────┐ │
│  │         PostgreSQL (shared)          │ │
│  │  hub_db  │  site_a_db  │  site_b_db │ │
│  └──────────────────────────────────────┘ │
│  ┌──────────────────────────────────────┐ │
│  │         Redis (shared)               │ │
│  └──────────────────────────────────────┘ │
│                                           │
│  Nginx reverse proxy:                     │
│    hub.example.com     → :3000            │
│    theology.example.com → :3001           │
│    ethics.example.com   → :3002           │
└──────────────────────────────────────────┘
```

### 15.3 Production — Distributed

Independent operators, each on own infrastructure, connecting to shared Hub over HTTPS. Sites never communicate directly — all cross-site data flows through Hub.

### 15.4 Standalone (No Federation)

Any site instance works fully without Hub connection. All federation features gracefully disabled. `AGORA_HUB_URL` env var empty = standalone mode.

---

## 16. Phasing

### Phase 1 — Core Platform (MVP)

Build a functional debate platform that solves the "digging" problem.

- User auth (OAuth + email/password)
- Debate CRUD (create, list, browse, search)
- Comment system with nested threading + compressed ancestor trail
- Stance declaration + badges
- Basic upvote/downvote (no reasons yet)
- Thread View + Sides View
- Basic user profiles
- Mobile-first responsive design
- Essential moderation (report button, admin removal)

### Phase 2 — Reasoned Voting & Advanced Views

The platform becomes analytically unique.

- Reasoned voting with all categories
- Vote reason breakdown display
- Best Exchanges View with pairing algorithm
- Neutral Verdict View with live SSE tallies
- Algorithmic stance detection
- Stance shift tracking (delta events)
- Burden of Proof mechanic
- Quarantine system + trust tiers
- Argument taxonomy tagging

### Phase 3 — Analytics, Federation & Correlation

Research-grade analytics and multi-site networking.

- Analytics dashboard per debate
- Engagement fingerprinting
- Hub service (OIDC, SSO, site registry)
- Profile linking + cross-site reputation
- Federation API
- Survey integration + correlation engine
- Cross-site search, leaderboards, discovery
- GDPR tooling (export, cascading deletion)
- Production deployment configurations
