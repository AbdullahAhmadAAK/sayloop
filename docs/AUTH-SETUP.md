# Auth setup (final checklist)

## What “two terminals” means

You do **not** need background shells or anything special. Just:

1. **Terminal 1** — start the backend and **leave it running** (don’t close the window):
   ```powershell
   cd g:\Hackathon\sayloop-backend
   npm run dev
   ```
2. **Terminal 2** — start the frontend and **leave it running**:
   ```powershell
   cd g:\Hackathon\sayloop-frontend
   npm run dev
   ```

Open http://localhost:5173/onboarding in your browser.

---

## Environment files (important)

| File | Keys |
|------|------|
| `sayloop-frontend/.env.local` | `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_API_URL=http://localhost:4000` |
| `sayloop-backend/.env` | `CLERK_SECRET_KEY`, `GEMINI_API_KEY`, `DATABASE_URL`, `DIRECT_URL`, `FRONTEND_URL`, `PORT` |

Put the **publishable** key (`pk_test_...`) only in the **frontend** file.  
Put the **secret** key (`sk_test_...`) only in the **backend** file.

---

## Database (required to finish auth)

Auth UI works with Clerk alone, but **saving the user in your app** needs PostgreSQL (e.g. [Neon](https://neon.tech)):

1. Create a Neon project and copy **pooled** → `DATABASE_URL` and **direct** → `DIRECT_URL`.
2. Replace the placeholder URLs in `sayloop-backend/.env`.
3. Run once:
   ```powershell
   cd g:\Hackathon\sayloop-backend
   npx prisma migrate dev --name auth_profile
   ```

---

## Clerk Dashboard

- Enable **Google** OAuth  
- Redirect URLs: `http://localhost:5173/sso-callback`, `http://localhost:5173/onboarding`

---

## Auth flow (what happens now)

1. Google sign-in (Clerk)  
2. Nickname (Gemini via `POST /api/ai/nickname-suggestions`)  
3. Avatar picker (DiceBear)  
4. Topics → saves to **Clerk** + **`PUT /api/users/me`** in Postgres  
5. On every sign-in: **`POST /api/users/sync`** creates/updates the DB user

---

## Quick test

- http://localhost:4000/api/health → `{ "ok": true }`  
- After sign-in, browser DevTools → Application → Local Storage → `db_user_id` should be set
