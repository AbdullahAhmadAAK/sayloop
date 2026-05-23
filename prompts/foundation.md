# PHASE 1: FOUNDATION & TECH STACK ANALYSIS

**Goal:** Understand project architecture, technology choices, and environment setup

**Give this prompt to your AI with the SayLoop codebase:**

---

You are analyzing the SayLoop codebase to create rebuild documentation for **Phase 1: Foundation**.

## YOUR TASK:

Analyze the following aspects and generate a comprehensive setup guide:

### 1. PROJECT STRUCTURE ANALYSIS

**Files to examine:**
- `sayloop-frontend/package.json`
- `sayloop-backend/package.json`
- `sayloop-frontend/vite.config.js` or `vite.config.ts`
- `sayloop-backend/src/app.js`
- `sayloop-backend/src/server.js`
- Root folder structure

**Document:**
- Monorepo structure (frontend + backend separation)
- Technology stack with exact versions
- Build tools and configuration
- Development vs Production setup

### 2. DEPENDENCY ANALYSIS

**For Frontend, list and explain:**
- React version and why
- Vite version and configuration
- Tailwind CSS setup (v4 specifics)
- Redux Toolkit + redux-saga versions
- Clerk auth package
- Socket.IO client
- Axios setup
- Any UI libraries

**For Backend, list and explain:**
- Express version
- Socket.IO version
- Prisma version
- Clerk SDK
- Database driver
- Validation libraries (Zod, etc.)
- Cron job library
- Any AI integrations (Gemini, OpenAI)

### 3. CONFIGURATION FILES

**Analyze these files completely:**
- `sayloop-frontend/vite.config.*`
- `sayloop-backend/src/config/env.js`
- `sayloop-backend/src/config/constants.js`
- `sayloop-frontend/tailwind.config.*` (if exists)
- `sayloop-frontend/index.css` (@theme animations)
- `.gitignore` files (both packages)
- `vercel.json` (if exists)

### 4. ENVIRONMENT VARIABLES

**Create .env.example templates for:**

**Backend (.env):**
List every environment variable needed:
- `DATABASE_URL` - what it's for, format example
- `DIRECT_URL` - when needed
- `CLERK_SECRET_KEY` - where to get it
- `PORT` - default value
- `FRONTEND_URL` - CORS setup
- `NODE_ENV` - values
- `GEMINI_API_KEY` - purpose
- `OPENAI_API_KEY` - if used
- Any others found in code

**Frontend (.env.local):**
- `VITE_CLERK_PUBLISHABLE_KEY` - how to obtain
- `VITE_API_URL` - backend URL
- `VITE_SOCKET_URL` - WebSocket URL
- Any others

### 5. FOLDER STRUCTURE BLUEPRINT

**Create a complete tree showing:**

```
sayLoop/
├── sayloop-frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── page/
│   │   ├── redux/
│   │   ├── lib/
│   │   ├── hooks/
│   │   └── constants/
│   ├── public/
│   └── package.json
├── sayloop-backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── modules/
│   │   ├── prisma/
│   │   └── utils/
│   └── package.json
└── README.md
```

Annotate every folder with its purpose.

### 6. INITIAL SETUP SCRIPT

**Provide step-by-step commands:**

```bash
# 1. Clone structure
mkdir sayLoop && cd sayLoop
mkdir sayloop-frontend sayloop-backend

# 2. Frontend setup
cd sayloop-frontend
npm init -y
npm install [exact package list with versions]

# 3. Backend setup
cd ../sayloop-backend
npm init -y
npm install [exact package list with versions]

# 4. Database setup
# [Neon/PostgreSQL setup instructions]

# 5. Clerk setup
# [Step-by-step Clerk account creation]
```

### 7. WHY THESE TECHNOLOGIES?

For each major tech choice, document:
- **Why chosen** (benefits)
- **Tradeoffs** (limitations)
- **Alternatives considered** (if evident)

Example:
- **Vite**: Fast HMR, ESM-native, but no SSR
- **Redux Toolkit + Saga**: Complex async flows, but more boilerplate than Zustand
- **Clerk**: Fast OAuth, but vendor lock-in

### 8. ARCHITECTURE DIAGRAM

Create a text-based architecture diagram showing:
- Client (browser)
- Frontend (Vercel)
- Backend (VPS/Railway)
- Database (Neon PostgreSQL)
- External services (Clerk, Gemini)
- Communication protocols (REST, WebSocket)

### OUTPUT FORMAT:

```markdown
# PHASE 1: FOUNDATION & SETUP GUIDE

## 1. Technology Stack
[Complete list with versions and justifications]

## 2. Environment Setup
[.env.example files for both packages]

## 3. Folder Structure
[Complete annotated tree]

## 4. Installation Guide
[Step-by-step setup from zero]

## 5. Configuration Explained
[Every config file explained line-by-line]

## 6. Architecture Overview
[Text diagram + explanation]

## 7. Development Workflow
[npm scripts, hot reload, database migrations]

## 8. Troubleshooting Common Setup Issues
[Known problems and solutions]

## Estimated Time: 2-3 hours
```

---

**After analysis, provide:**
1. Complete package.json for frontend (with exact versions)
2. Complete package.json for backend (with exact versions)
3. Both .env.example files
4. Architecture diagram
5. Setup script that works from scratch