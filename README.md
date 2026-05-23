# SayLoop

Gamified language learning through live debate — match with a partner, pick a topic, and practice in a video session.

## Project layout

| Folder | Stack |
|--------|--------|
| `sayloop-frontend/` | React 19, Vite, Clerk, Redux, Socket.IO, WebRTC |
| `sayloop-backend/` | Express, Socket.IO, Prisma, PostgreSQL |

## Run locally

**Backend** (port 4000):

```bash
cd sayloop-backend
cp .env.example .env   # fill DATABASE_URL, CLERK_SECRET_KEY
npm install
npm run dev
```

**Frontend** (port 5173):

```bash
cd sayloop-frontend
cp .env.example .env.local   # VITE_CLERK_PUBLISHABLE_KEY, VITE_API_URL
npm install
npm run dev
```

Open http://localhost:5173 — use two browsers or incognito for two users.

## Env

- Backend: `sayloop-backend/.env` — see `.env.example`
- Frontend: `sayloop-frontend/.env.local` — see `.env.example`

Never commit `.env` files.
