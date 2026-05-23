# SayLoop

Gamified language learning through live debate — match with a partner, pick a topic, and practice speaking in a 5-minute video session.

## Monorepo layout

| Package | Path | Description |
|---------|------|-------------|
| Frontend | `packages/frontend` | React + Vite + Clerk + Socket.IO |
| Backend | `packages/backend` | Express + Socket.IO + Prisma + PostgreSQL |

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Environment

- Copy `packages/backend/.env.example` → `packages/backend/.env`
- Copy `packages/frontend/.env.example` → `packages/frontend/.env.local`

Set `DATABASE_URL`, `CLERK_SECRET_KEY`, and `VITE_CLERK_PUBLISHABLE_KEY` from [Clerk](https://dashboard.clerk.com).

### 3. Run locally

```bash
npm run dev
```

- Frontend: http://localhost:5173  
- Backend: http://localhost:4000  

## Features

- Clerk auth + onboarding
- Browse online users and send topic-based challenges
- Real-time match invites (Socket.IO)
- Live debate room with WebRTC video/audio
- 5-minute server timer, resign / draw, XP scoring

See `details/communication-product-building-plan.md` for architecture notes.
