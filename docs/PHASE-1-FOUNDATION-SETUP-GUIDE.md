# PHASE 1: FOUNDATION & SETUP GUIDE

**Product:** SayLoop — gamified language learning + live debate  
**Layout:** Monorepo (`sayloop-frontend` + `sayloop-backend`)  
**Source:** Reverse-engineered from production (see `details/communication-product-building-plan.md`)  
**Estimated time:** 2–3 hours

> **Note:** The original SayLoop repo is not in this workspace. Versions and structure match the rebuild blueprint (Appendix C). Re-run file-by-file config review when you clone production source.

---

## 1. Technology Stack

### 1.1 Monorepo structure

| Package | Role | Deploy target |
|---------|------|---------------|
| `sayloop-frontend/` | React 19 SPA (Vite 7) | Vercel → static `dist/` |
| `sayloop-backend/` | Express 4 + Socket.IO 4 | VPS / Railway / Render |
| Root | Docs, prompts, hackathon plan | — |

**Why split packages:** Independent deploy cadence (edge CDN for UI, long-lived Node for WebSockets), clear env boundaries (no secrets in Vite bundle).

### 1.2 Frontend dependencies

| Package | Version (target) | Why |
|---------|------------------|-----|
| **react** / **react-dom** | ^19.2.0 | UI; production uses React 19 |
| **vite** | ^7.2.4 | Dev server, HMR, production build |
| **@vitejs/plugin-react** | ^5.x | JSX/TSX, Fast Refresh |
| **typescript** | ^5.x | Type safety across app |
| **tailwindcss** + **@tailwindcss/vite** | ^4.x | Utility CSS via Vite plugin (no `tailwind.config.js`) |
| **@reduxjs/toolkit** | ^2.x | Slices, reducers, DevTools |
| **redux-saga** | ^1.x | Socket listeners, sequential match/session flows |
| **react-redux** | ^9.x | Store provider |
| **react-router-dom** | ^7.x | Client routing, guards |
| **@clerk/clerk-react** | ^5.60.0 | Auth UI, session, JWT |
| **@clerk/elements** | ^0.x | Styled sign-in/sign-up |
| **socket.io-client** | ^4.8.3 | Realtime match + session |
| **axios** | ^1.x | REST with Bearer token |

**UI libraries:** No heavy component library (MUI/Chakra). Custom components + Tailwind. Fonts: **Nunito** (base), **Outfit** (marketing sections).

### 1.3 Backend dependencies

| Package | Version (target) | Why |
|---------|------------------|-----|
| **express** | ^4.22.1 | HTTP API, middleware |
| **socket.io** | ^4.8.3 | WebSocket rooms, debate + match events |
| **@prisma/client** | ^5.0.0 | Type-safe DB access |
| **prisma** (dev) | ^5.0.0 | Migrations, Studio |
| **@clerk/clerk-sdk-node** | ^4.x | JWT verify, `ClerkExpressWithAuth` |
| **zod** | ^3.22.x | Request validation |
| **node-cron** | ^3.x | Match expiry, weekly XP reset, streak reset |
| **@google/generative-ai** | ^0.x | AI nickname suggestions |
| **openai** | ^4.x | In package.json but **unused** in src |
| **cors** | ^2.x | `FRONTEND_URL` allowlist |
| **morgan** | ^1.x | HTTP logging |
| **express-rate-limit** | ^7.x | Browse/auth throttling |
| **dotenv** | ^16.x | Local env loading |

### 1.4 Infrastructure

| Service | Purpose |
|---------|---------|
| **Neon PostgreSQL** | Primary DB; pooled `DATABASE_URL`, `DIRECT_URL` for migrations |
| **Clerk** | OAuth, email, JWT for REST + Socket.IO handshake |
| **Vercel** | Frontend hosting + SPA rewrites |
| **Gemini** | Optional nickname API |

### 1.5 Technology tradeoffs

| Choice | Benefits | Tradeoffs |
|--------|----------|-----------|
| **Vite** | Fast HMR, ESM-native, simple SPA build | No SSR/SEO for `/` without extra work |
| **Redux Toolkit + Saga** | Clear async/socket side effects | More boilerplate than Zustand or TanStack Query |
| **Clerk** | Auth in hours | Vendor lock-in; `unsafeMetadata` for onboarding flag |
| **Socket.IO** | Rooms, reconnect, pairs with Express | Needs Redis adapter to scale horizontally |
| **Prisma + Neon** | Migrations, types, serverless Postgres | `directUrl` required for some DDL on Neon |
| **Tailwind v4** | No separate config file; `@theme` in CSS | Design tokens not centralized in one theme file |

---

## 2. Environment Setup

### 2.1 Backend — `sayloop-backend/.env.example`

See file: `sayloop-backend/.env.example`

### 2.2 Frontend — `sayloop-frontend/.env.example`

See file: `sayloop-frontend/.env.example` (copy to `.env.local` for Vite).

### 2.3 Client-only storage (not env)

| Key | Set by | Purpose |
|-----|--------|---------|
| `db_user_id` | `useAuthInit` after sync | Match API, socket identity |
| `clerk_id` | sync | Socket auth fallback |
| `user_nickname` | onboarding | Display name |

---

## 3. Folder Structure

```
sayLoop/                              # Monorepo root (this repo: g:\Hackathon)
├── docs/
│   └── PHASE-1-FOUNDATION-SETUP-GUIDE.md   # This document
├── details/
│   └── communication-product-building-plan.md  # Full rebuild spec
├── prompts/                          # Phase 1–5 AI analysis prompts
│   ├── foundation.md
│   ├── auth.md
│   ├── database.md
│   ├── backend.md
│   └── workflow.md                   # Phase 5: frontend (misnamed)
├── sayloop-frontend/                 # Vite React SPA
│   ├── public/                       # Static assets (favicon, etc.)
│   ├── src/
│   │   ├── main.tsx                  # ClerkProvider → Redux → Router
│   │   ├── App.tsx                   # useAuthInit, routes, LevelUpModal
│   │   ├── index.css                 # @import tailwind; @theme animations
│   │   ├── components/
│   │   │   ├── routes/routes.tsx     # Route table + guards + GlobalMatchWatcher
│   │   │   ├── ui/                   # Shared UI (SkeletonCard, etc.)
│   │   │   └── modules/              # Feature UI (auth, match, sessions, …)
│   │   ├── page/                     # Route-level pages (Match, Session, Home)
│   │   ├── redux/                    # store, slice/, saga/, service/
│   │   ├── lib/                      # axiosInstance, matchApi
│   │   ├── hooks/                    # useAuthInit, usePageTracking
│   │   ├── constants/                # topics.ts (mirror backend)
│   │   ├── mocks/                    # next/* shims for migrated code
│   │   └── assets/                   # Sidebar SVGs
│   ├── .env.example                  # → copy to .env.local
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── vercel.json                   # SPA fallback rewrite
├── sayloop-backend/                  # Express + Socket.IO API
│   ├── src/
│   │   ├── app.js                    # Express factory, CORS, routes
│   │   ├── server.js                 # HTTP server, Socket.IO, cron, DB connect
│   │   ├── config/
│   │   │   ├── env.js                # Required env validation
│   │   │   ├── constants.js          # API path prefixes
│   │   │   ├── database.js           # Prisma singleton + retry
│   │   │   ├── sessionConfig.js      # Debate timer, mic limits
│   │   │   └── topics.js             # 8 debate topics
│   │   ├── middleware/               # auth, validate, rateLimit, error, logger
│   │   ├── modules/                  # users, match, sessions, economy, …
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── seed.js
│   │   │   └── migrations/
│   │   └── utils/                    # scheduler, xp, debateScore, response
│   ├── .env.example
│   └── package.json
└── README.md                         # Quick start (create at root)
```

---

## 4. Installation Guide

### 4.1 Prerequisites

- **Node.js** 20 LTS or 22+
- **npm** 10+
- Accounts: [Neon](https://neon.tech), [Clerk](https://clerk.com), (optional) [Google AI Studio](https://aistudio.google.com) for Gemini

### 4.2 Bootstrap from zero (Windows / macOS / Linux)

```powershell
# From repo root (g:\Hackathon or your clone path)
cd sayloop-backend
copy .env.example .env
# Edit .env: DATABASE_URL, DIRECT_URL, CLERK_SECRET_KEY, PORT, FRONTEND_URL

npm install
npx prisma generate
npx prisma migrate dev --name init

npm run dev
# API + Socket.IO on http://localhost:4000
```

```powershell
# New terminal
cd sayloop-frontend
copy .env.example .env.local
# Edit: VITE_CLERK_PUBLISHABLE_KEY, VITE_API_URL=http://localhost:4000

npm install
npm run dev
# SPA on http://localhost:5173
```

### 4.3 Neon PostgreSQL

1. Create project at [console.neon.tech](https://console.neon.tech).
2. Copy **pooled** connection string → `DATABASE_URL`.
3. Copy **direct** (non-pooled) string → `DIRECT_URL` (migrations only).
4. In `schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 4.4 Clerk

1. Create application at [dashboard.clerk.com](https://dashboard.clerk.com).
2. Enable Email + Google (or providers you need).
3. **Frontend:** API Keys → Publishable key → `VITE_CLERK_PUBLISHABLE_KEY`.
4. **Backend:** Secret key → `CLERK_SECRET_KEY`.
5. Allowed origins: `http://localhost:5173`, production Vercel URL.
6. JWT template: default session token works with `verifyToken` on socket.

### 4.5 Production deploy (summary)

| Layer | Steps |
|-------|--------|
| **Frontend** | Connect repo to Vercel; set `VITE_*` env; build `npm run build`; `vercel.json` rewrites to `index.html` |
| **Backend** | Set all backend env vars; `npm run build` (generate + migrate deploy); `npm start` |
| **CORS** | `FRONTEND_URL` must match exact Vercel URL (no trailing slash mismatch) |

---

## 5. Configuration Explained

### 5.1 `sayloop-frontend/vite.config.ts` (expected pattern)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      // Optional dev proxy so axios can use relative /api
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
});
```

- **`@` alias:** Imports like `@/redux/store`.
- **Tailwind v4:** Plugin replaces PostCSS + `tailwind.config.js`.
- **Proxy:** Optional; production uses `VITE_API_URL` instead.

### 5.2 `sayloop-frontend/index.css` (Tailwind v4 + animations)

```css
@import "tailwindcss";

@theme {
  --font-sans: "Nunito", ui-sans-serif, system-ui, sans-serif;
  --animate-float: float 6s ease-in-out infinite;
  /* float, floatA, floatB, pop, shimmer, db, fadeInUp — see blueprint §8.4 */
}
```

Brand colors used in components: cream `#F8F5EF`, orange `#E8480C`, green `#3D7A5C`.

### 5.3 `sayloop-frontend/vercel.json`

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Enables client-side routing for `/match`, `/session`, etc.

### 5.4 `sayloop-backend/src/config/env.js` (behavior)

| Variable | Required when |
|----------|----------------|
| `DATABASE_URL` | `NODE_ENV=production` |
| `CLERK_SECRET_KEY` | production |
| `PORT` | production |
| `FRONTEND_URL` | production |

**Development:** Missing vars → **warn**, server still starts (Neon cold-start tolerance).  
**Production:** Missing required vars → **throw** at startup.

### 5.5 `sayloop-backend/src/config/constants.js`

Documents and exports API path prefixes (`/api/users`, `/api/matches`, `/api/economy`, …). Not every documented route is wired — treat as contract reference during rebuild.

### 5.6 `sayloop-backend/src/app.js` vs `server.js`

| File | Responsibility |
|------|----------------|
| `app.js` | `express()`, `cors({ origin: FRONTEND_URL })`, `express.json()`, mount routers, error middleware |
| `server.js` | `http.createServer(app)`, attach Socket.IO, `io.use` Clerk auth, register socket handlers, start cron scheduler, listen on `PORT` |

### 5.7 `.gitignore` (both packages)

Ignore: `node_modules/`, `.env`, `.env.local`, `dist/`, `.vercel`, Prisma local DB files, OS junk.

---

## 6. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│  BROWSER                                                                  │
│  React 19 │ Redux+Saga │ Clerk session │ Axios (REST) │ Socket.IO (WS)   │
│  WebRTC peer connection (audio/video — signaling via Socket.IO)          │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
          HTTPS REST  (Authorization: Bearer <Clerk JWT>)
          WSS         (handshake.auth.token + clerkId)
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  sayloop-backend (Node.js — port 4000 typical)                            │
│  Express routers ──► controllers ──► services ──► Prisma                │
│  Socket.IO: match.socket.js │ session.socket.js (in-memory session state) │
│  node-cron: match expiry, weekly XP reset, streak safety                  │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │ Prisma (pooled URL)
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  Neon PostgreSQL                                                          │
└──────────────────────────────────────────────────────────────────────────┘

        ┌─────────────┐              ┌─────────────┐
        │   Clerk     │              │   Gemini    │
        │  (auth)     │              │ (nicknames) │
        └─────────────┘              └─────────────┘
```

**Request flow (REST):** Client → CORS check → Morgan log → JSON body → `clerkAuth` → `resolveDbUser` → controller → Prisma → JSON response.

**Realtime flow:** Socket connect → verify JWT → join `user:{dbUserId}` room → match/session events → server timer + economy on `session:end`.

---

## 7. Development Workflow

### 7.1 npm scripts (target)

**Frontend (`sayloop-frontend/package.json`):**

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `vite` | HMR dev server :5173 |
| `build` | `tsc -b && vite build` | Production bundle → `dist/` |
| `preview` | `vite preview` | Local preview of build |
| `lint` | `eslint .` | Lint |

**Backend (`sayloop-backend/package.json`):**

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `nodemon src/server.js` | Auto-restart API |
| `start` | `node src/server.js` | Production |
| `build` | `prisma generate && prisma migrate deploy` | Deploy prep |
| `migrate` | `prisma migrate dev` | Dev migrations |
| `studio` | `prisma studio` | DB GUI |
| `seed` | `node src/prisma/seed.js` | Seed curriculum/users |

### 7.2 Typical dev loop

1. Start backend (`npm run dev` in `sayloop-backend`).
2. Start frontend (`npm run dev` in `sayloop-frontend`).
3. Sign in via Clerk → `useAuthInit` POST `/api/users/sync` → socket connects.
4. After schema changes: `npm run migrate` in backend.

### 7.3 Hot reload

- **Frontend:** Vite HMR (instant).
- **Backend:** Nodemon restarts on file save (socket state lost — reconnect clients).

---

## 8. Troubleshooting Common Setup Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| CORS error on API | `FRONTEND_URL` mismatch | Set exact origin (`http://localhost:5173`, no trailing slash) |
| Socket connects then disconnects | Invalid/expired Clerk token | Re-login; ensure `VITE_SOCKET_URL` points to API host |
| `prisma migrate` fails on Neon | Using pooled URL for DDL | Set `DIRECT_URL` to non-pooled connection |
| Blank page after sign-in | Onboarding metadata false | Complete `/onboarding` or set `unsafeMetadata.onboardingComplete` |
| Env vars undefined in browser | Missing `VITE_` prefix | Only `VITE_*` exposed by Vite |
| Production boot crash | Missing required env | Fill `DATABASE_URL`, `CLERK_SECRET_KEY`, `PORT`, `FRONTEND_URL` |
| 401 on all API calls | Token getter not set | Ensure `useAuthInit` runs before API calls |
| WebRTC no audio | Permissions / HTTP | Use HTTPS in prod; allow mic in browser |
| XP not updating | Wrong economy path | Use `session.socket` end flow (`xp`), not legacy `points` |

---

## Deliverables checklist

- [x] This setup guide (sections 1–8)
- [x] `sayloop-frontend/package.json`
- [x] `sayloop-backend/package.json`
- [x] `sayloop-frontend/.env.example`
- [x] `sayloop-backend/.env.example`
- [x] Architecture diagram (§6)
- [x] Setup script (§4)

**Next phase:** `prompts/auth.md` (Phase 2) or blueprint §5 — Clerk sync + middleware.
