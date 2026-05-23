# SayLoop — Complete Project Reconstruction Blueprint

**Version:** 1.0 (reverse-engineered from production codebase)  
**Audience:** Hackathon teams, new engineers, system designers  
**Goal:** Rebuild SayLoop from absolute zero in 24–48 hours without copying source files  
**Repository layout:** Monorepo with `sayloop-frontend/` and `sayloop-backend/`

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Full Tech Stack Breakdown](#2-full-tech-stack-breakdown)
3. [Complete Folder Structure](#3-complete-folder-structure)
4. [Environment Variables Analysis](#4-environment-variables-analysis)
5. [Authentication System Deep Dive](#5-authentication-system-deep-dive)
6. [Database Architecture](#6-database-architecture)
7. [Frontend Architecture](#7-frontend-architecture)
8. [UI/UX System Analysis](#8-uiux-system-analysis)
9. [Complete Component Breakdown](#9-complete-component-breakdown)
10. [Realtime System Architecture](#10-realtime-system-architecture)
11. [Matching System Logic](#11-matching-system-logic)
12. [API System Analysis](#12-api-system-analysis)
13. [State Management Analysis](#13-state-management-analysis)
14. [Performance Optimization](#14-performance-optimization)
15. [Security Analysis](#15-security-analysis)
16. [Deployment Architecture](#16-deployment-architecture)
17. [Complete Hackathon Rebuild Plan](#17-complete-hackathon-rebuild-plan)
18. [File-by-File Rebuild Instructions](#18-file-by-file-rebuild-instructions)
19. [UI Recreation Guide](#19-ui-recreation-guide)
20. [Full User Flow Analysis](#20-full-user-flow-analysis)
21. [Gamification Engine](#21-gamification-engine)
22. [Scalability Plan](#22-scalability-plan)
23. [Failure Scenarios](#23-failure-scenarios)
24. [Improvement Ideas](#24-improvement-ideas)
25. [Final Rebuild Masterplan](#25-final-rebuild-masterplan)

---

# 1. PROJECT OVERVIEW

## 1.1 What SayLoop Is

**SayLoop** is a gamified **language learning + live debate** platform. Users practice speaking a target language by:

1. Browsing potential partners (Duolingo-inspired UX)
2. Sending **topic-based match requests**
3. Entering a **real-time voice/video debate session** (WebRTC + Socket.IO)
4. Earning **XP, gems, streaks, and leaderboard rank** from session outcomes

The product merges three proven mechanics:

| Mechanic | Inspiration | SayLoop implementation |
|----------|-------------|------------------------|
| Structured curriculum | Duolingo | `Course` → `Section` → `Unit` → `Lesson` → `Exercise` schema (partially UI-only today) |
| Social speaking practice | Tandem, HelloTalk | Partner browse + match requests + live sessions |
| Competitive retention | Chess.com, gaming apps | XP economy, streaks, weekly leaderboard, level titles |

## 1.2 Core Mission

**Mission:** Make speaking practice as addictive and measurable as vocabulary drills.

**Problem:** Language learners complete reading/writing apps but avoid live conversation due to anxiety, scheduling friction, and lack of immediate feedback loops.

**Solution:** Short (5-minute), structured debate sessions with clear topics, server-authoritative scoring, and instant rewards.

## 1.3 Target Audience

| Segment | Needs | SayLoop fit |
|---------|-------|-------------|
| Self-learners (18–35) | Low-commitment speaking reps | 5-min sessions, swipe-to-match |
| Debate club / ESL students | Topic prompts + timers | `topics.js` prompts/tasks |
| Gamification-motivated users | Progress visibility | XP, streaks, leaderboard |
| Hackathon judges | Clear demo path | Landing → sign up → match → debate in <3 min |

## 1.4 Business Model Possibilities

| Model | Implementation hook |
|-------|---------------------|
| Freemium hearts | `hearts` module exists (Duolingo-style lives) — routes stubbed |
| Premium topics / AI coach | `OPENAI_API_KEY`, `GEMINI_API_KEY` partially wired |
| Gems shop | `ShopPage` static UI; `POST /api/economy/spend-gems` exists |
| B2B classrooms | Course schema + org accounts (not built) |
| Sponsored debate topics | Topic config is static JS — easy to swap |

## 1.5 Why This Product Matters

Speaking is the **highest-friction** language skill. Apps that only teach recognition leave a gap SayLoop targets directly. Real-time debate with gamification creates:

- **Accountability** (partner waiting in session)
- **Measurable progress** (XP, win/loss stats)
- **Habit loops** (daily streak, weekly leaderboard reset)

## 1.6 Competitor Comparison

| Product | Strength | SayLoop differentiator |
|---------|----------|------------------------|
| Duolingo | Curriculum + streaks | Live human debate, not bots |
| Tandem | 1:1 chat | Structured 5-min debate + server scoring |
| Clubhouse / Discord | Voice rooms | Topic prompts + XP outcomes |
| Praktika / AI tutors | Always available | Real peers + competitive leaderboard |

## 1.7 Core Differentiators

1. **Server-authoritative debate outcomes** — clients cannot fake XP
2. **Browse-then-request matching** — not anonymous roulette (reduces abuse)
3. **Topic-first UX** — every match has a `topic` string driving prompts
4. **Dual transport** — REST for persistence, Socket.IO for live state
5. **Clerk-first auth** — fast OAuth; backend maps `clerkId` → internal `User.id`

## 1.8 Hackathon Value Proposition

A team can demo **end-to-end value** in 48 hours by prioritizing:

- Clerk auth + user sync
- Match browse/send/accept
- Socket session with timer + basic WebRTC
- XP toast on session end

Curriculum (`Learn` page), shop, and quests are **stretch goals** (UI exists, backend partial).

---

# 2. FULL TECH STACK BREAKDOWN

## 2.1 Architecture Diagram (Text)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Vercel SPA)                              │
│  React 19 + Vite 7 + Tailwind 4 + Redux Toolkit + redux-saga            │
│  Clerk React │ Socket.IO Client │ Axios │ WebRTC                          │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTPS REST + WSS
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js — VPS / Railway)                     │
│  Express 4 │ Socket.IO 4 │ Clerk SDK │ Prisma 5 │ node-cron             │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ Prisma (pooled + direct URL)
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              PostgreSQL (Neon serverless — typical deployment)           │
└─────────────────────────────────────────────────────────────────────────┘
```

## 2.2 Frontend Technologies

### React 19 + Vite 7

| Aspect | Detail |
|--------|--------|
| **Why chosen** | Fast HMR, ESM-native, minimal config vs CRA/Next for SPA |
| **Pros** | Instant dev feedback, tree-shaking, `@` path aliases |
| **Cons** | No SSR/SEO out of box (marketing page is CSR) |
| **Alternatives skipped** | Next.js (project uses mocks for `next/navigation` shims only) |
| **Integration** | `main.tsx` → `ClerkProvider` → `Provider` → `BrowserRouter` → `App` |

### Tailwind CSS v4 (`@tailwindcss/vite`)

| Aspect | Detail |
|--------|--------|
| **Why** | Utility-first matches rapid UI iteration; v4 drops separate config file |
| **Pros** | `@theme` custom animations in `index.css` |
| **Cons** | Design tokens scattered in components (`#E8480C`, `#F8F5EF`) not centralized |
| **Integration** | Vite plugin; no `tailwind.config.js` |

### Redux Toolkit + redux-saga

| Aspect | Detail |
|--------|--------|
| **Why** | Side effects (socket listeners, sequential match flow) isolated from UI |
| **Pros** | Predictable match/session state machines |
| **Cons** | Boilerplate vs Zustand/React Query; two parallel slices (`partners` vs `match`) |
| **Integration** | 6 slices + 6 sagas in `redux/store.ts` |

### Clerk (`@clerk/clerk-react`, `@clerk/elements`)

| Aspect | Detail |
|--------|--------|
| **Why** | OAuth + email verification in hours, not weeks |
| **Pros** | Hosted UI, JWT for API/socket |
| **Cons** | Vendor lock-in; `unsafeMetadata` for onboarding flag |
| **Integration** | `VITE_CLERK_PUBLISHABLE_KEY`; sync to backend via `/api/users/sync` |

### Socket.IO Client 4.8

| Aspect | Detail |
|--------|--------|
| **Why** | Pairs with server; auto-reconnect; room semantics |
| **Integration** | Singleton in `redux/service/socket.service.ts` |

### Axios

| REST with Clerk Bearer via `setTokenGetter` in `useAuthInit` |

## 2.3 Backend Technologies

### Express 4.22

| **Why** | Team familiarity, huge middleware ecosystem |
| **Integration** | `app.js` mounts routers; `server.js` wraps HTTP + Socket.IO |

### Socket.IO 4.8

| **Why** | Namespaces/rooms, fallback transports, integrates with Express server |
| **Handlers** | `session.socket.js` (debate), `match.socket.js` (ready confirm, join) |

### Prisma 5 + PostgreSQL

| **Why** | Type-safe schema, migrations, Neon-compatible `directUrl` |
| **Schema** | `src/prisma/schema.prisma` — 20+ models |
| **Alternatives** | Raw SQL (slower iteration), Supabase client (less control) |

### Clerk SDK Node (`@clerk/clerk-sdk-node`)

| HTTP: `ClerkExpressWithAuth` + `verifyToken` fallback |
| Socket: `verifyToken(handshake.auth.token)` |

### Zod 3.22

| Request validation via `validate.middleware.js` |

### node-cron 3

| Match expiry, weekly XP reset, streak reset |

### AI (optional)

| `@google/generative-ai` | Nickname suggestions (`nameService.js`) |
| `openai` | Listed in package.json, **unused** in src |

## 2.4 Infrastructure (Observed / Inferred)

| Layer | Current state |
|-------|---------------|
| **Frontend host** | Vercel (`vercel.json`, `sayloop.vercel.app` in CORS) |
| **Backend host** | Not in repo — likely VPS/PM2 or Railway (scheduler comments mention PM2) |
| **Database** | Neon PostgreSQL (`DATABASE_URL` pooled, `DIRECT_URL` for migrate) |
| **CDN** | Vercel edge for static assets |
| **CI/CD** | Not present in repo |
| **Monitoring** | Morgan logs only; no Sentry/Datadog |

## 2.5 Testing & Dev Tools

| Tool | Status |
|------|--------|
| ESLint | Both packages |
| Unit tests | **None** |
| E2E | **None** |
| Prisma Studio | `npm run studio` |
| Nodemon | Backend dev |

---

# 3. COMPLETE FOLDER STRUCTURE

## 3.1 Monorepo Root

```
sayLoop/
├── sayloop-frontend/     # Vite React SPA → Vercel
├── sayloop-backend/      # Express API + Socket.IO → VPS/PaaS
└── SAYLOOP_REBUILD_BLUEPRINT.md   # This document
```

**Naming convention:** `sayloop-*` packages; `@sayloop/web` npm name on frontend.

## 3.2 Backend Tree (Source Only)

```
sayloop-backend/src/
├── app.js                 # Express app factory
├── server.js              # HTTP server, Socket.IO, scheduler, DB connect
├── config/
│   ├── constants.js       # API path prefixes + documented (not all wired) routes
│   ├── database.js        # Prisma singleton, getDb(), connectWithRetry
│   ├── env.js             # Required env validation
│   ├── sessionConfig.js   # SESSION_DURATION, MIC_OFF_LIMIT, etc.
│   └── topics.js          # 8 debate topics with prompts/tasks
├── middleware/
│   ├── auth.middleware.js # clerkAuth, resolveDbUser, protect
│   ├── error.middleware.js
│   ├── logger.middleware.js
│   ├── rateLimit.middleware.js
│   └── validate.middleware.js
├── modules/               # Feature-vertical slices
│   ├── users/             # Sync, profile CRUD
│   ├── match/             # REST + match.socket.js
│   ├── sessions/          # REST legacy + session.socket.js (primary)
│   ├── economy/           # XP, gems, leaderboard economy
│   ├── leaderboard/
│   ├── profiles/
│   ├── notifications/     # Stub controllers
│   ├── hearts/            # Stub (controller bug: req.user.dbId)
│   ├── levels/            # Empty router
│   └── ai/                # Nicknames + topics list
├── prisma/
│   ├── schema.prisma
│   ├── seed.js
│   └── migrations/
└── utils/
    ├── scheduler.js       # Cron jobs
    ├── streak.js          # Legacy lastSubmission logic (unused by economy)
    ├── xp.js              # Lesson XP constants
    ├── league.js          # Tier by XP (unused)
    ├── paginate.js
    ├── response.js
    └── debateScore.js
```

### Why feature folders?

**Scalability:** Each module owns route → controller → service → validation. New engineers add `modules/foo/` without touching unrelated code.

**Communication flow:**

```
HTTP Request → middleware chain → controller → service → Prisma → response
Socket Event → io.use auth → handler → in-memory state + Prisma → emit
```

## 3.3 Frontend Tree

```
sayloop-frontend/src/
├── main.tsx               # ClerkProvider, Redux, Router
├── App.tsx                # useAuthInit, usePageTracking, Routes, LevelUpModal
├── index.css              # Tailwind + @theme animations
├── components/
│   ├── routes/routes.tsx  # All routing + guards + GlobalMatchWatcher
│   ├── ui/                # SkeletonCard
│   └── modules/
│       ├── auth/          # SignIn, SignUp, OnBoardingPage, NicknamePicker
│       ├── landing/       # Marketing sections
│       ├── home/          # Sidebar, TopBar, PageShell, Rightsidebar
│       ├── match/         # SwipeCard, modals, history
│       ├── sessions/      # Session screen, WebRTC, result
│       ├── profile/       # Tabs, hero, settings
│       └── gamification/  # XP bar, streak, badges
├── page/                  # Route-level page components
├── redux/                 # store, slice/, saga/, service/
├── lib/                   # axiosInstance, matchApi
├── hooks/                 # useAuthInit, usePageTracking
├── constants/topics.ts    # Frontend topic mirror
├── mocks/                 # next/* shims for migrated code
└── assets/                # SVG icons for sidebar
```

---

# 4. ENVIRONMENT VARIABLES ANALYSIS

## 4.1 Backend (`sayloop-backend/.env`)

| Variable | Required | Purpose | Used in | Security | Example |
|----------|----------|---------|---------|----------|---------|
| `DATABASE_URL` | **Yes** (prod) | Pooled Postgres connection | Prisma client | **Secret** — never expose | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `DIRECT_URL` | Migrate only | Direct connection for `prisma migrate` | schema.prisma | Secret | Non-pooled Neon URL |
| `CLERK_SECRET_KEY` | **Yes** | Verify JWT, ClerkExpressWithAuth | auth, server socket | **Critical secret** | `sk_live_...` |
| `PORT` | **Yes** | HTTP+WS port | server.js | Public | `4000` |
| `FRONTEND_URL` | **Yes** | CORS + Socket origins | app.js, server.js | Public | `https://sayloop.vercel.app` |
| `NODE_ENV` | No | `production` throws on missing env | env.js, Prisma logs | — | `production` |
| `OPENAI_API_KEY` | No | Exported, **unused** | — | Secret | — |
| `GEMINI_API_KEY` | De facto for AI | Nickname generation | nameService.js | Secret | `AIza...` |

### Production vs Development

| Behavior | Development | Production |
|----------|-------------|------------|
| Missing required env | Warn, server starts | **Throws** in `env.js` |
| DB down | Server still listens; per-request errors | Same — intentional for Neon cold start |
| Debug route | `/api/debug/auth-check` exposes key prefix | **Remove** |

## 4.2 Frontend (`sayloop-frontend/.env`)

| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| `VITE_CLERK_PUBLISHABLE_KEY` | **Yes** | ClerkProvider | `pk_live_...` |
| `VITE_API_URL` | No | Axios baseURL | `https://api.sayloop.com` |
| `VITE_SOCKET_URL` | No | Socket.IO URL | Same host as API |

**Vite rule:** Only `VITE_*` vars are exposed to browser — never put secrets here.

## 4.3 LocalStorage Keys (Client)

| Key | Set by | Purpose |
|-----|--------|---------|
| `db_user_id` | `useAuthInit` after sync | Match requests, socket identity |
| `clerk_id` | sync | Socket fallback auth |
| `user_nickname` | onboarding | Display |

---

# 5. AUTHENTICATION SYSTEM DEEP DIVE

## 5.1 Identity Model

```
Clerk User (external ID: user_xxx)
        │
        │ POST /api/users/sync
        ▼
Postgres User (internal ID: integer, clerk_id unique)
        │
        │ req.dbUserId on protected routes
        ▼
All match/session/economy operations use integer ID
```

**Why two IDs?** Clerk owns auth lifecycle; SayLoop owns game state and foreign keys. Integer IDs are faster to index and join than Clerk strings.

## 5.2 Signup Flow (Sequence)

```
User → /sign-up → Clerk Elements (email or Google OAuth)
  → Clerk creates session
  → Redirect /home (or /sign-in/sso-callback → /home)
  → OnboardingGuard: onboardingComplete? NO → /onboarding
  → OnBoardingPage: 4 steps
  → Clerk unsafeMetadata.onboardingComplete = true
  → PUT /api/users/me (learningLanguage, interests, username)
  → /home
```

## 5.3 Login Flow

```
User → /sign-in → Clerk session
  → useAuthInit runs:
      1. setTokenGetter(getToken)
      2. POST /api/users/sync { email, firstName, lastName, pfpSource }
      3. localStorage db_user_id, clerk_id
      4. FETCH_ECONOMY, loadRequests, initMatchSocket
  → OnboardingGuard passes → app pages
```

## 5.4 Session Persistence

| Layer | Mechanism |
|-------|-----------|
| Clerk | HTTP-only session cookies (Clerk-managed) |
| API | `Authorization: Bearer <JWT>` per Axios request |
| Socket | `handshake.auth.token` + optional `clerkId` fallback |
| App | `localStorage` for db user id (convenience, not security boundary) |

## 5.5 Token Handling

```javascript
// axiosInstance.ts pattern
api.interceptors.request.use(async (config) => {
  const token = await tokenGetter?.() ?? window.Clerk?.session?.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
});
// 401 → refresh token once → retry
```

## 5.6 Socket Auth (server.js)

```
1. If handshake.auth.token → verifyToken → payload.sub → find User by clerkId
2. Else if handshake.auth.clerkId → find User
3. Else → reject
4. On success: socket.dbUserId = user.id, join room `user:{id}`
```

**Edge case:** User signed into Clerk but never called `/sync` → socket error "User not synced".

## 5.7 Middleware Protection

| Middleware | Stack | Effect |
|------------|-------|--------|
| `clerkAuth` | ClerkExpressWithAuth | Sets `req.auth.userId` |
| `resolveDbUser` | Prisma lookup | Sets `req.dbUserId` |
| `protect` / `requireAuth` | Both | 401 if missing |

## 5.8 RBAC

**Not implemented.** `adminOnly` middleware returns 501. All authenticated users share same permissions.

## 5.9 Route Guards (Frontend)

| Guard | Checks |
|-------|--------|
| `ProtectedRoute` | `isSignedIn` |
| `OnboardingGuard` | signed in + `user.unsafeMetadata.onboardingComplete` |

## 5.10 Security Concerns

1. `/api/profiles/:userId` — **no auth** on public profile GET
2. `/api/debug/auth-check` — leaks key metadata
3. `clerkId` socket fallback weaker than JWT
4. No refresh token rotation logic in app (delegated to Clerk)

## 5.11 Account Recovery

Fully delegated to **Clerk** (password reset, OAuth re-link).

---

# 6. DATABASE ARCHITECTURE

## 6.1 ER Overview (Text Diagram)

```
Course ──< Section ──< Unit ──< Lesson ──< Exercise ──< ExerciseOption
  │                                    │
  │                                    └──< ExerciseAttempt >── User
  │
  └──< UserCourseProgress >── User

User ──< Match >── User  (requester/receiver)
User ──< XPTransaction
User ──< GemTransaction
User ──< Follow >── User
User ──< UserDailyQuest >── QuestDefinition
User ──< LessonCompletion >── Lesson
```

## 6.2 Core Models (Rebuild Reference)

### User

| Field | Type | Purpose |
|-------|------|---------|
| `clerkId` | String unique | Auth bridge |
| `username` | String? unique | @handle |
| `points` | Int | **Legacy** leaderboard points |
| `streakLength` | Int | Daily streak count |
| `xp`, `gems`, `level` | Int | **New economy** |
| `learningLanguage` | String? | e.g. `es`, `fr` |
| `interests` | Json | Array of topic IDs |
| `lastActiveDate` | DateTime? | Streak UTC logic |
| `xpThisWeek` | Int | Weekly leaderboard |
| `totalMatches/Wins/Draws/Resigns` | Int | Stats |

**Indexes:** `points DESC`, `xp DESC`, `xpThisWeek DESC`, `clerkId`, `learningLanguage`

### Match

| Field | Purpose |
|-------|---------|
| `requesterId`, `receiverId` | FK to User |
| `topic` | VARCHAR(100) — topic id string |
| `status` | Enum: PENDING → ACCEPTED → CONFIRMED → IN_SESSION → COMPLETED / REJECTED / EXPIRED / ABANDONED |
| `sessionId` | Set on accept: `session_{matchId}_{timestamp}` |
| `outcome` | WIN_*, DRAW, RESIGN_*, INCOMPLETE |
| `xpAwarded` | Boolean guard |

### Economy Tables

- `XPTransaction` — audit log with `XPReason` enum
- `GemTransaction` — `GemReason` enum

### Curriculum Tables

Full Duolingo-style hierarchy preserved for future `Learn` integration; seed data in `prisma/seed.js`.

## 6.3 Migrations Strategy

```bash
# Dev
npm run migrate        # prisma migrate dev

# Prod build
npm run build          # prisma generate && prisma migrate deploy
```

**Why `directUrl`?** Neon pooler breaks some migration DDL; direct connection required.

## 6.4 Query Optimization Patterns

- Leaderboard: indexed `xp`, `xpThisWeek`, `points`
- Match history: `status + createdAt` composite index
- `updateMany` with status guard for atomic accept (race prevention)

## 6.5 Dual Economy Warning

| System | Field | Active in |
|--------|-------|-----------|
| Legacy | `points` | `session.service.saveSessionResult`, old xpService |
| Current | `xp`, `gems` | `session.socket` end → `processSessionEconomy` |

**Rebuild recommendation:** Use **xp only** for hackathon; drop points or migrate.

---

# 7. FRONTEND ARCHITECTURE

## 7.1 Rendering Strategy

**Pure CSR (Client-Side Rendering).** Vite builds static assets; React hydrates on load. No SSR.

**Why acceptable:** App behind auth; SEO matters only on `/` marketing route.

## 7.2 Routing Map

| Path | Component | Guard |
|------|-----------|-------|
| `/` | Marketing | Public |
| `/sign-in/*`, `/sign-up/*` | Clerk Elements | Public |
| `/onboarding` | OnBoardingPage | ProtectedRoute |
| `/home`, `/learn`, `/leaderboard`, `/quests`, `/more`, `/shop`, `/profile`, `/match`, `/session` | Various | OnboardingGuard |

## 7.3 Layout Composition

```
OnboardingGuard pages:
  PageShell
    ├── Sidebar (desktop) / TopBar (mobile)
    ├── main {children}
    └── Rightsidebar (economy widgets)
```

## 7.4 State Management Layers

| Layer | Tool | Data |
|-------|------|------|
| Auth | Clerk hooks | Session, metadata |
| Global app | Redux | match, session, economy, profile, leaderboard |
| Local UI | useState | Modals, tabs, animations |
| Server cache | Manual fetch in sagas | No React Query |

## 7.5 Form Handling

- Onboarding: controlled inputs → Clerk `user.update()` + `PUT /api/users/me`
- Match: topic picker state → saga `sendRequest`

## 7.6 Error / Loading

- Guards return `null` while `!isLoaded` (blank screen — improvement: skeleton)
- Saga errors → `match.toast` / slice `error`
- Session: `session.status` drives matchmaking vs active vs ended

## 7.7 Responsive Strategy

`PageShell` uses `isDesktop` breakpoint (~1024px): sidebar vs bottom nav pattern.

## 7.8 Accessibility

Partial: semantic buttons, some aria missing on custom modals. **Rebuild:** add `role="dialog"`, focus trap on modals.

---

# 8. UI/UX SYSTEM ANALYSIS

## 8.1 Typography

| Font | Usage |
|------|-------|
| **Nunito** | Base `--font-sans` in index.css |
| **Outfit** | Imported per-page via Google Fonts in components |

**Why two fonts?** Nunito = friendly/gamified; Outfit = marketing polish. **Inconsistency risk** — rebuild should pick one primary.

## 8.2 Color Palette

| Token | Hex | Psychology |
|-------|-----|------------|
| Cream background | `#F8F5EF` | Calm, non-threatening study environment |
| Brand orange | `#E8480C` | Urgency, CTA, Duolingo-adjacent energy |
| Success green | `#3D7A5C` | Achievement, correct answers |
| Dark text | `#141414` | Readability |
| Amber/gold | `#B45309` | Rewards, streaks, premium feel |

## 8.3 Spacing & Layout

- Rounded corners: `rounded-2xl`, `rounded-3xl` (friendly)
- Card padding: `p-4` to `p-6`
- Mobile-first with desktop sidebar expansion

## 8.4 Animation System (`index.css` @theme)

| Animation | Use case |
|-----------|----------|
| `float`, `floatA`, `floatB` | Landing hero elements |
| `pop` | Modals, match found |
| `shimmer` | Loading skeletons |
| `db` | Audio waveform dots |
| `fadeInUp` | Section reveals |

## 8.5 Gamification UX Psychology

| Element | Retention mechanism |
|---------|---------------------|
| **Streak counter** | Loss aversion — don't break the chain |
| **XP popups post-session** | Immediate variable reward |
| **Weekly leaderboard** | Social comparison + Monday reset → re-engagement |
| **Level titles** (Newbie → Grandmaster) | Identity progression |
| **Match request notification** | Real-time social obligation |
| **5-second countdown** on MatchFoundModal | Urgency to join session |

## 8.6 Onboarding UX (4 Steps)

1. Name + AI nickname suggestions (GEMINI)
2. Profile photo (optional)
3. Learning language
4. Interest tags (maps to topic IDs)

**Why 4 steps?** Commitment escalation — each step increases sunk cost before first match.

---

# 9. COMPLETE COMPONENT BREAKDOWN

## 9.1 Layout Components

### Sidebar (`components/modules/home/Sidebar.tsx`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Primary nav: Home, Learn, Match, Leaderboard, Quests, Shop, Profile |
| **State** | Redux `economy.xp`, `economy.streak`, `match.pendingRequestCount` |
| **Badge** | Pending match requests count on Match icon |

### TopBar

Mobile header with menu toggle.

### PageShell

Wraps authenticated pages; responsive shell.

### Rightsidebar

Economy summary: gems, hearts (visual), streak — reads `economy` slice.

## 9.2 Match Components

### SwipeCard

| Prop | Type | Purpose |
|------|------|---------|
| `user` | MatchUser | Partner card data |
| `topic` | string | Selected topic id |
| `onSend` | fn | Trigger `sendRequest` saga |
| `onSkip` | fn | Advance `cardIdx` |
| `sending`, `exiting`, `exitDir` | UI animation states |

### WaitingScreen

Shown when `match.mode === 'waiting'` after outbound request.

### MatchFoundModal

5-second countdown; calls `confirmReady` → emits `match:confirm-ready`.

### IncomingRequest / MatchHistory

Tab content on Match page; accept/reject via saga.

### GlobalMatchWatcher (in routes.tsx)

Overlay on **any page** when `match.notification` set; accept navigates to `/match`.

## 9.3 Session Components

### SessionScreen (`sessionScreen/index.tsx`)

Central debate UI; subscribes to `session` slice; hosts WebRTC refs.

### useWebRTC (`Userwebrtc.tsx`)

| Signal events | `offer`, `answer`, `ice-candidate` |
| Media | `getUserMedia` audio/video |

### Controlbar

Mute, camera, draw offer, reactions, resign.

### ConversationPanel

Topic prompts from `constants/topics.ts`; phase timer display.

### ResultScreen

Shows `debateResult` + `economy.pendingReward` after `session:end`.

### LevelUpModal (App-level)

Listens `economy.levelledUp`; 8s auto-dismiss.

## 9.4 Profile Components

- **ProfileHeroCard** — points/league display
- **ProfileStatsTab** — API-driven stats
- **ProfileAchievementsTab** — client-computed achievements
- **ProfileSettingsTab** — Clerk sign out

## 9.5 Landing Components

| Component | Role |
|-----------|------|
| Navbar | Logo, sign in/up |
| Hero | Value prop + CTA |
| Stats | Social proof numbers |
| HowItWorks | 3-step explainer |
| BentoGrid | Feature cards |
| LanguageCarousel | Flag icons animation |
| CTA / Footer | Conversion |

---

# 10. REALTIME SYSTEM ARCHITECTURE

## 10.1 Connection Lifecycle

```
Client ensureConnected()
  → io(VITE_SOCKET_URL, { auth: { token, clerkId }, transports: ['websocket'] })
Server io.use(auth)
  → join user:{dbUserId}
Client page:join { page: '/match' }
  → server joins page:/match and page:/match:user:{id}
```

## 10.2 Room Topology

| Room pattern | Members | Purpose |
|--------------|---------|---------|
| `user:{userId}` | All sockets for user | Targeted emits (match requests, level up) |
| `page:{pathname}` | Users on same route | Analytics/presence (partial) |
| `{sessionId}` | Debate participants | Session events, WebRTC relay |
| `page:{page}:user:{id}` | Per-user page channel | Fine-grained routing |

## 10.3 Session State Machine (Server In-Memory)

```
sessionState Map:
  sessionId → {
    ended: boolean,
    timerInterval,
    startedAt, endsAt,
    users: { [userId]: { speakingTime, micOffStart, resigned, ... } }
  }
```

**Critical:** State is **per server process** — horizontal scaling requires Redis adapter (see §22).

## 10.4 Server-Authoritative Timer

```javascript
// Pseudocode — session.socket.js
startTimer(io, sessionId):
  every 1s:
    remaining = endsAt - now
    emit 'timer:update' { remainingSeconds }
    if remaining <= 0: endSession(DRAW or speaking-time win)
```

**Why server timer?** Prevents client clock manipulation.

## 10.5 Mic Inactivity Anti-Abuse

| Config | Value |
|--------|-------|
| `MIC_OFF_LIMIT` | 45s |
| `WARNING_BEFORE_RESIGN` | 10s countdown |

Flow: mic off → start timestamp → warning emit → auto-resign → opponent wins.

## 10.6 WebRTC Signaling

Peer-to-peer media; server only relays SDP/ICE via socket events. **TURN server not in repo** — needed for strict NAT in production.

## 10.7 Reconnection

Socket.IO client auto-reconnects; user must re-`join-session` if disconnected mid-debate. **Gap:** full state recovery not implemented — treat disconnect as resign on server.

## 10.8 Complete Socket Event Catalog

### Match handler (`match.socket.js`)

| Direction | Event | Payload |
|-----------|-------|---------|
| In | `page:join` | `{ page }` |
| In | `page:leave` | — |
| In | `match:confirm-ready` | `{ matchId }` |
| In | `match:join-session` | `{ sessionId }` |
| Out | `match:session-start` | session metadata |
| Out | `session-joined`, `partner-joined` | — |
| Out | `match:request-received` | match object (from REST) |
| Out | `match:accepted`, `match:rejected`, `match:badge_count` | — |

### Session handler (`session.socket.js`)

| In | `find-partner`, `offer`, `answer`, `ice-candidate`, `chat-message`, `debate-argument`, `emoji:react`, `offer-draw`, `accept-draw`, `decline-draw`, `resign`, `mic:status`, `speaking:tick`, `leave-session` |
| Out | `waiting`, `matched`, `session:start`, `timer:update`, `session:end`, `economy:update`, `mic:warning`, `user:resigned`, `partner-disconnected`, chat/argument relays |

### Economy (via user room)

| Out | `level_up` | `{ oldLevel, newLevel, newTitle, gemsEarned }` |

---

# 11. MATCHING SYSTEM LOGIC

## 11.1 Model: Request-Based (Not Random Queue)

SayLoop uses **explicit partner selection**:

1. User A browses `/api/users/browse`
2. User A swipes/sends request to User B with `topic`
3. User B accepts or rejects
4. Both confirm ready → session starts

**Why not random queue?** Reduces troll matching; lets users pick level/language visually.

## 11.2 Browse Filters (`user.service` browse)

Typically filters by `learningLanguage`, excludes self, may use interests overlap (verify in `user.service.js` when rebuilding).

## 11.3 Topic Matching

Topic chosen by **requester** at request time; stored on `Match.topic`. Receiver sees topic before accept.

## 11.4 Skill Balancing

**Not automated.** Users infer skill from `points`/`level` on cards. Optional +5 XP for beating higher-level opponent in `processSessionEconomy`.

## 11.5 Anti-Abuse

| Mechanism | Implementation |
|-----------|----------------|
| Duplicate pending match | Returns existing PENDING instead of duplicate |
| Self-match | 400 error |
| Stale match cleanup | Cron expires PENDING (5m), ACCEPTED (10m) |
| Atomic accept | `updateMany` where status=PENDING |
| Rate limits | global 500/15min, browse 60/min, auth 20/min |

## 11.6 Quick Match Queue (`find-partner`)

Alternate path in `session.socket.js`:

```javascript
queue: Map<topic, [{ userId, socketId, timestamp }]>
findOpponent(topic, userId) → pair waiting users
```

**Fallback** when no browse partner — hackathon can implement this for faster demos.

## 11.7 Match Status Flow

```
PENDING ──accept──► ACCEPTED ──both confirm-ready──► CONFIRMED
   │                      │
   reject                 └── join-session ──► IN_SESSION
   ▼
REJECTED / EXPIRED (cron) / ABANDONED (new request supersedes)
```

---

# 12. API SYSTEM ANALYSIS

## 12.1 Complete Endpoint Reference

### Health

```
GET / → { message, status: 'healthy' }
GET /api/debug/auth-check → diagnostic (REMOVE IN PROD)
```

### Users `/api/users`

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/sync` | clerkAuth | email, firstName?, lastName?, pfpSource? | User created/updated |
| GET | `/me` | protect | — | Current user |
| PUT | `/me` | protect | username, names, pfp, learningLanguage, interests | Updated user |
| GET | `/me/stats` | protect | — | Stats aggregate |
| GET | `/browse` | protect | — | Partner list |

### Matches `/api/matches`

| Method | Path | Body/Params | Side effects |
|--------|------|-------------|--------------|
| POST | `/find` | userId, partnerId, topic | Creates PENDING; socket notify receiver |
| GET | `/active` | query userId | Active matches |
| GET | `/history` | userId, page, limit | Paginated history |
| GET | `/:matchId` | — | Match detail |
| POST | `/:matchId/accept` | — | ACCEPTED + sessionId; socket `match:accepted` |
| POST | `/:matchId/reject` | — | REJECTED; socket `match:rejected` |

### Sessions `/api/sessions`

| Method | Path | Notes |
|--------|------|-------|
| GET | `/history` | Last 5 lesson completions (legacy naming) |
| POST | `/result` | Legacy points — prefer socket economy |

### Economy `/api/economy`

| Method | Path | Response |
|--------|------|----------|
| GET | `/summary` | xp, gems, level, streak, transactions |
| GET | `/transactions` | XP history |
| GET | `/leaderboard` | XP-based rankings |
| POST | `/spend-gems` | `{ cost }` deduct gems |

### Leaderboard `/api/leaderboard`

| GET | `/paginated` | Page of users by xp/points |
| GET | `/top` | Top N |
| GET | `/rank/:userId` | Single user rank |

### Profiles `/api/profiles`

| GET | `/search` | Partner search (legacy) |
| GET | `/:userId` | **Public** profile |
| GET | `/:userId/stats` | Protected stats |

### AI `/api/ai`

| POST | `/name-suggestions` | `{ name }` → Gemini nicknames |
| GET | `/topics` | Static topic list |

### Hearts `/api/hearts` (stub/buggy)

| GET | `/:userId/status` | — |
| POST | `/:userId/use`, `/refill` | Controller uses wrong `req.user.dbId` |

## 12.2 Example API Documentation

```http
POST /api/matches/find
Authorization: Bearer <clerk_jwt>
Content-Type: application/json

{
  "userId": 42,
  "partnerId": 17,
  "topic": "travel"
}

Response 201:
{
  "success": true,
  "data": {
    "id": 101,
    "status": "pending",
    "topic": "travel",
    "requester": { "id": 42, "firstName": "Alex", ... },
    "receiver": { "id": 17, ... }
  }
}
```

---

# 13. STATE MANAGEMENT ANALYSIS

## 13.1 Match Slice State Machine

```
mode: 'browse' | 'waiting' | 'matched' | 'confirmed'

browse + sendRequest → waiting
waiting + match:accepted → matched
matched + confirmReady + match:session-start → confirmed
confirmed → navigate /session
```

## 13.2 Session Slice State Machine

```
idle → searching (find-partner) → matched → in_session → ended
```

## 13.3 Economy Slice

Updated by:
- `FETCH_ECONOMY` saga on login
- `economy:update` socket after session
- `level_up` socket event

## 13.4 Saga Pattern (Rebuild Template)

```typescript
// match.saga.ts pattern
function* initMatchSocket() {
  const socket = yield call(getOrCreateSocket);
  socket.on('match:accepted', (data) => {
    yield put(setMatched(data));
  });
  // ... register all listeners once
}
```

**Critical:** Only register listeners **once** — `useAuthInit` must not double-init (bug was fixed by removing duplicate init from GlobalMatchWatcher).

## 13.5 Cache Invalidation

Manual: after accept, `loadRequests`; after session, `FETCH_ECONOMY`. No normalized cache.

---

# 14. PERFORMANCE OPTIMIZATION

## 14.1 Frontend

| Technique | Status |
|-----------|--------|
| Code splitting | Default Vite route chunks possible — not heavily used |
| Lazy routes | **Not implemented** — static imports |
| Image optimization | SVG icons; logo.png in public |
| Memoization | Sparse — rebuild with `React.memo` on SwipeCard |
| Virtualization | Browse list small — not needed yet |

## 14.2 Backend

| Technique | Detail |
|-----------|--------|
| DB connection pool | Neon pooled URL |
| `getDb()` wrapper | Retries on transient failures |
| In-memory session | Fast but not horizontally scalable |
| Rate limiting | Prevents abuse |

## 14.3 Socket

- `transports: ['websocket']` only — skips long-polling overhead
- Room-targeted emits vs broadcast

## 14.4 Bundle

Vite tree-shaking; Clerk + Socket.IO are largest deps — consider dynamic import for session page only.

---

# 15. SECURITY ANALYSIS

## 15.1 Auth Security

- Clerk handles password hashing, OAuth
- JWT verified server-side for socket and API fallback

## 15.2 XSS

React escapes by default; avoid `dangerouslySetInnerHTML` (not used in audited files).

## 15.3 CSRF

Bearer token API — CSRF less relevant for SPA; cookies are Clerk's domain.

## 15.4 Rate Limiting

`express-rate-limit` on global, browse, auth routes.

## 15.5 Socket Security

- Auth required on connection
- Session join verifies user is participant of match

## 15.6 API Validation

Zod on most routes; fix `session.validation.js` shape for `saveResultSchema`.

## 15.7 Headers (Vercel)

`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, Permissions-Policy allows camera/mic for debate.

## 15.8 Environment

Never commit `.env`; rotate `CLERK_SECRET_KEY` if debug endpoint was exposed.

---

# 16. DEPLOYMENT ARCHITECTURE

## 16.1 Frontend (Vercel)

```json
// vercel.json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Build: `npm run build` → `dist/`  
Env vars set in Vercel dashboard.

## 16.2 Backend (Inferred)

No Dockerfile in repo. Typical setup:

```bash
npm install
npm run build          # prisma migrate deploy
npm start              # node src/server.js
# PM2 for process management (referenced in scheduler comments)
```

Env on host: all §4.1 variables.

## 16.3 SSL

Terminate at reverse proxy (Nginx/Caddy) or PaaS; Vercel automatic for frontend.

## 16.4 Scaling Blockers

- In-memory `sessionState` and `queue` Maps
- Single Node process assumption

## 16.5 Rollback

- Frontend: Vercel instant rollback to prior deployment
- Backend: redeploy previous build; DB migrations are forward-only — plan migrations carefully

## 16.6 Monitoring Gap

Add: structured logging (pino), Sentry, health check endpoint with DB ping, Socket.IO connection metrics.

---

# 17. COMPLETE HACKATHON REBUILD PLAN

## 17.1 Team Structure (Ideal: 4 people)

| Role | Ownership |
|------|-----------|
| **Backend lead** | Express, Prisma, socket handlers, economy |
| **Frontend lead** | React routes, Redux, match UI |
| **Realtime/AV** | Socket.IO, WebRTC, session screen |
| **Design/PM** | Landing, tokens, demo script |

## 17.2 MVP vs Stretch

| Priority | Feature |
|----------|---------|
| P0 | Clerk auth + user sync |
| P0 | Browse + match request/accept |
| P0 | Socket session + timer + end economy |
| P1 | WebRTC audio |
| P1 | Global match notification |
| P2 | Leaderboard page |
| P3 | Learn path, shop, quests, hearts |

## 17.3 Day 1 (Hours 0–12) — Foundation

| Hour | Task |
|------|------|
| 0–2 | Init monorepo: Vite React + Express; Neon DB; Prisma schema (User, Match) |
| 2–4 | Clerk apps (dev keys); POST /sync; protect middleware |
| 4–6 | Frontend: sign-in, onboarding metadata, axios + token |
| 6–8 | GET /browse; POST /matches/find; accept/reject |
| 8–10 | Socket auth + user rooms; emit match:request-received |
| 10–12 | Match page: SwipeCard, waiting state, accept flow |

## 17.4 Day 2 (Hours 12–24) — Live Session

| Hour | Task |
|------|------|
| 12–14 | match.socket confirm-ready + join-session |
| 14–18 | session.socket: timer, chat, endSession, processSessionEconomy |
| 18–20 | Session page + Redux session slice |
| 20–22 | Basic WebRTC audio |
| 22–24 | Result screen + XP display; landing page CTA |

## 17.5 Day 3 (Hours 24–36) — Polish

| Hour | Task |
|------|------|
| 24–26 | Leaderboard API + page |
| 26–28 | GlobalMatchWatcher overlay |
| 28–30 | Cron match expiry; deploy backend + Vercel |
| 30–32 | End-to-end demo testing |
| 32–36 | Buffer: mic warning, streak display, bug fixes |

## 17.6 Emergency Fallbacks

| Failure | Fallback |
|---------|----------|
| WebRTC broken | Text-only chat debate |
| Socket down | HTTP poll accept status every 3s |
| Clerk down | Mock auth dev banner (dev only) |
| DB down | Show maintenance page; queue requests in memory (demo only) |

---

# 18. FILE-BY-FILE REBUILD INSTRUCTIONS

## 18.1 Backend — Creation Order

| Order | File | Logic to implement |
|-------|------|-------------------|
| 1 | `config/env.js` | Validate env vars |
| 2 | `config/database.js` | Prisma singleton + getDb retry |
| 3 | `prisma/schema.prisma` | User + Match minimum |
| 4 | `middleware/auth.middleware.js` | Clerk + resolveDbUser |
| 5 | `modules/users/user.service.js` | syncUser, browse |
| 6 | `modules/match/match.service.js` | request/accept/reject |
| 7 | `app.js` + `server.js` | Mount routes, Socket.IO |
| 8 | `modules/match/match.socket.js` | confirm-ready, join-session |
| 9 | `config/sessionConfig.js` | Timing constants |
| 10 | `modules/sessions/session.socket.js` | Full debate handler |
| 11 | `modules/economy/xp.service.js` | applyXP, processSessionEconomy |
| 12 | `utils/scheduler.js` | Cron expiry |

### Pseudocode: syncUser

```javascript
async function syncUser(clerkId, { email, firstName, lastName, pfpSource }) {
  return prisma.user.upsert({
    where: { clerkId },
    create: { clerkId, email, firstName, lastName, pfpSource },
    update: { email, firstName, lastName, pfpSource },
  });
}
```

### Pseudocode: requestMatch

```javascript
async function requestMatch({ userId, partnerId, topic }) {
  assert(userId !== partnerId);
  const existing = await findPendingBetween(userId, partnerId);
  if (existing) return existing;
  return prisma.match.create({
    data: { requesterId: userId, receiverId: partnerId, topic, status: 'PENDING' },
  });
}
```

## 18.2 Frontend — Creation Order

| Order | File | Logic |
|-------|------|-------|
| 1 | `main.tsx` | Providers |
| 2 | `lib/axiosInstance.ts` | Token interceptor |
| 3 | `hooks/useAuthInit.ts` | Sync + socket init |
| 4 | `redux/store.ts` + slices | match, session, economy |
| 5 | `redux/service/socket.service.ts` | Singleton |
| 6 | `redux/saga/match.saga.ts` | Socket listeners |
| 7 | `components/routes/routes.tsx` | Guards |
| 8 | `page/Match/Match.tsx` | Browse UI |
| 9 | `page/Session/Session.tsx` | Debate UI |
| 10 | `components/modules/sessions/sessionScreen/*` | WebRTC |

---

# 19. UI RECREATION GUIDE

## 19.1 Landing Page (`/`)

```
Navbar (fixed)
  logo | Sign In | Get Started (orange pill)

Hero
  headline: practice speaking through live debates
  subcopy + CTA button → /sign-up
  floating cards with animate-float

Stats row (3 columns)

HowItWorks (3 steps with icons)

BentoGrid (feature cards, varied sizes)

LanguageCarousel (flags scroll)

CTA section (gradient background)

Footer (links placeholder)
```

**Spacing:** section `py-16` to `py-24`; max-width `max-w-6xl mx-auto`.

## 19.2 Dashboard (`/home`)

```
PageShell
  Sidebar | main
    Welcome header
    Grid of cards: Continue Learning, Find Partner, Leaderboard
    Streak + XP summary chips
```

## 19.3 Match Page (`/match`)

```
Tabs: Browse | Requests | History

Browse tab:
  TopicPicker (horizontal chips)
  SwipeCard center
  Skip / Send buttons

mode=waiting → WaitingScreen
mode=matched|confirmed → MatchFoundModal overlay
```

## 19.4 Session Page (`/session`)

```
Requires location.state.sessionId

Phases:
  1. MatchmakingScreen (joining...)
  2. SessionScreen
     - Videoarea (local + remote)
     - ConversationPanel (topic + timer)
     - Controlbar
  3. ResultScreen
```

## 19.5 Profile (`/profile`)

```
ProfileHeroCard
Tab bar: Stats | Achievements | Settings
```

## 19.6 Leaderboard (`/leaderboard`)

```
Top 3 podium visual
Paginated list with xpThisWeek
User rank chip at bottom
```

---

# 20. FULL USER FLOW ANALYSIS

## 20.1 New User Journey

```
Landing → Sign Up → Clerk verify email → /home
  → redirect /onboarding → 4 steps → metadata complete
  → /home → click Find Partner → /match
  → select topic → send request → waiting
  → (Partner accepts) → modal → Let's Go
  → /session → debate 5 min → results → XP earned
  → return /home with updated streak
```

## 20.2 Returning User

```
Sign In → useAuthInit sync → socket connect
  → may receive match:request-received on any page
  → accept → /match → session
```

## 20.3 Receiver Flow

```
GlobalMatchWatcher OR /match Requests tab
  → see requester + topic
  → Accept → match:accepted (both sides)
  → MatchFoundModal → confirm ready
  → match:session-start → navigate session
```

## 20.4 Debate Flow (In Session)

```
join-session → session-joined
  → both present → session:start (300s timer)
  → users speak (speaking:tick), chat, debate-argument
  → optional: offer-draw → accept-draw → DRAW outcome
  → or resign → opponent WIN
  → timer ends → speaking time comparison → WIN or DRAW
  → session:end + economy:update
  → ResultScreen
```

---

# 21. GAMIFICATION ENGINE

## 21.1 XP Values (Session — Active System)

| Outcome | Requester XP | Receiver XP |
|---------|--------------|-------------|
| WIN_REQUESTER | +25 | 0 |
| WIN_RECEIVER | 0 | +25 |
| RESIGN_REQUESTER | -15 | +25 |
| RESIGN_RECEIVER | +25 | -15 |
| DRAW | 0 | 0 |
| Beat higher level | +5 bonus | +5 bonus |
| First session today | +5 DAILY_LOGIN each | |
| Level up | +20 LEVEL_UP_BONUS | |

## 21.2 Level Table

| Level | Min XP | Title |
|-------|--------|-------|
| 1 | 0 | Newbie |
| 2 | 100 | Beginner |
| 3 | 300 | Speaker |
| 4 | 600 | Talker |
| 5 | 1000 | Debater (+3 gems) |
| 6 | 1800 | Orator |
| 7 | 3000 | Influencer |
| 8 | 5000 | Champion |
| 9 | 8000 | Legend |
| 10 | 12000 | Grandmaster (+10 gems) |

## 21.3 Streak Logic

**Active:** `economy/xp.service.updateStreak` using `lastActiveDate` UTC.

```
if last active day == today: no streak increment
if last active day == yesterday: streak++
else: streak = 1
```

**Cron safety:** Daily 00:01 UTC resets streak to 0 if `lastActiveDate` before yesterday.

**Legacy unused:** `utils/streak.js` uses `lastSubmission` — do not mix.

## 21.4 Gem Milestones

| Trigger | Reward |
|---------|--------|
| Every 10 wins+draws | `checkMatchMilestone` |
| Streak 7/14/30/60/100 days | `checkStreakMilestone` |
| Level 5, 10 | Level-up gems |

## 21.5 Achievement Ideas (Client-Side Today)

Profile page computes achievements from stats thresholds — rebuild as server-side `Achievement` table for integrity.

## 21.6 Retention Loops

```
Daily: streak + first session XP
Weekly: xpThisWeek leaderboard reset Monday
Social: match requests create obligation
Progression: level titles + level up modal
```

---

# 22. SCALABILITY PLAN

## 22.1 Socket.IO Horizontal Scaling

```javascript
// Add @socket.io/redis-adapter
const { createAdapter } = require('@socket.io/redis-adapter');
const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));
```

Move `sessionState` and `queue` to Redis hashes with TTL.

## 22.2 Database

- Read replicas for leaderboard/browse
- Partition `matches` by `createdAt` monthly
- Archive old matches to cold storage

## 22.3 CDN

Static assets on Vercel edge; API behind Cloudflare for DDoS.

## 22.4 Queue Systems

For AI nickname generation and email notifications: BullMQ + Redis.

## 22.5 Serverless

Socket.IO **requires** persistent connections — not ideal for pure serverless. Use containers (Fly.io, Railway, ECS).

---

# 23. FAILURE SCENARIOS

| Scenario | Symptom | Handling |
|----------|---------|----------|
| WebSocket disconnect | Debate freezes | Server treats as resign; client re-join session or show reconnect modal |
| Auth token expired | 401 on API | Axios retry with fresh Clerk token |
| User not synced | Socket connection error | Call `/api/users/sync` before socket init |
| DB unavailable | 500 errors | Server starts anyway; getDb retries; show user-friendly message |
| Neon cold start | Slow first query | connectWithRetry; increase pool timeout |
| Race on accept | Double session | `updateMany` where status=PENDING |
| Duplicate session:end | Double XP | `sess.ended` guard flag |
| Cron failure | Stale matches | withResilience logs; never crashes PM2 |
| Heart controller bug | 500 on hearts | Fix `req.dbUserId` before shipping hearts feature |

---

# 24. IMPROVEMENT IDEAS

## 24.1 Product

- AI debate judge (Gemini scores arguments)
- Real-time translation subtitles
- Topic voting before match
- Friend system (`Follow` model exists)
- Classroom mode with teacher dashboard

## 24.2 Moderation

- Report user button → strike system
- Auto-flag profanity in `chat-message`
- Block list

## 24.3 Monetization

- SayLoop Plus: unlimited hearts, premium topics
- Cosmetic profile badges in shop (wire `spend-gems`)

## 24.4 Technical Debt to Fix

1. Unify `points` and `xp`
2. Remove duplicate `partners` vs `match` slices
3. Wire shop to economy
4. Implement level routes or remove module
5. Add TURN server for WebRTC
6. Remove `/api/debug/auth-check`
7. Fix hearts controller
8. Add `.env.example` files
9. CI: lint + prisma validate + typecheck

---

# 25. FINAL REBUILD MASTERPLAN

## 25.1 Architecture Summary

**SayLoop = Clerk-authenticated SPA + Express/Socket.IO API + PostgreSQL/Prisma**, optimized for **short live language debates** with **server-authoritative outcomes** and **XP/gem/streak economy**.

## 25.2 Exact Implementation Sequence (Condensed)

1. Database + User model + Clerk sync  
2. Match REST + socket notifications  
3. Session socket + timer + economy  
4. Frontend auth pipeline (`useAuthInit`)  
5. Match UI + Session UI + WebRTC  
6. Leaderboard + landing marketing  
7. Cron + production deploy  

## 25.3 Fastest Rebuild Strategy

| Shortcut | Safe for hackathon? |
|----------|---------------------|
| Skip Learn/Quest/Shop UI | ✅ Yes |
| Text-only session (no WebRTC) | ✅ Day 1 fallback |
| Single topic hardcoded | ✅ |
| In-memory sessions only | ✅ Single server |
| Skip gem economy | ✅ XP only |
| Use Clerk hosted UI | ✅ |

| Do NOT shortcut | Reason |
|-----------------|--------|
| Server-side session end | Anti-cheat |
| Clerk → DB user mapping | Foreign keys |
| Atomic match accept | Race conditions |
| Socket auth | Abuse prevention |

## 25.4 Production-Grade Later

- Redis Socket.IO adapter
- TURN/STUN for WebRTC
- Sentry + structured logs
- E2E tests (Playwright: sign up → match → session)
- `.env.example` + GitHub Actions CI
- Remove debug endpoints
- Consolidate economy fields

## 25.5 Success Criteria for Rebuild

- [ ] Two users can sign up with Clerk  
- [ ] User A sends match request with topic  
- [ ] User B receives real-time notification and accepts  
- [ ] Both enter session with 5-minute timer  
- [ ] Session end updates XP in database and UI  
- [ ] Leaderboard shows updated rankings  
- [ ] Deployed: frontend Vercel + backend public URL  

---

## Appendix A: Match Status Enum Reference

```
PENDING | ACCEPTED | CONFIRMED | IN_SESSION | COMPLETED | REJECTED | ABANDONED | EXPIRED
```

## Appendix B: Topic IDs (Backend `config/topics.js`)

`daily_life`, `travel`, `technology`, `food`, `sports`, `work_study`, `entertainment`, `future_goals`

## Appendix C: Key Dependency Versions

| Package | Version |
|---------|---------|
| react | ^19.2.0 |
| vite | ^7.2.4 |
| express | ^4.22.1 |
| socket.io | ^4.8.3 |
| @prisma/client | ^5.0.0 |
| @clerk/clerk-react | ^5.60.0 |

## Appendix D: Known Bugs in Source (Fix When Rebuilding)

1. `heart.controller.js` — uses `req.user.dbId` instead of `req.dbUserId`  
2. `session.validation.js` — Zod schema shape incompatible with validate middleware  
3. `match.socket.js` — imports non-existent `startTimerForRoom`  
4. `levels/level.route.js` — empty  
5. Dual onboarding components — only `OnBoardingPage` is routed  
6. `partners` Redux slice unused by Match page  

---

*End of SayLoop Rebuild Blueprint — generated by reverse engineering the complete codebase.*
