# PHASE 2: AUTHENTICATION SYSTEM ANALYSIS

**Goal:** Understand and document the complete authentication flow (Clerk + custom backend sync)

**Give this prompt to your AI with the SayLoop codebase:**

---

You are analyzing the SayLoop authentication system to create rebuild documentation for **Phase 2: Authentication**.

## YOUR TASK:

### 1. CLERK INTEGRATION ANALYSIS

**Frontend files to examine:**
- `sayloop-frontend/src/main.tsx` (ClerkProvider setup)
- `sayloop-frontend/src/hooks/useAuthInit.ts`
- `sayloop-frontend/src/components/modules/auth/*` (SignIn, SignUp, Onboarding)
- `sayloop-frontend/src/lib/axiosInstance.ts` (token handling)

**Document:**
- How ClerkProvider is initialized
- Where `VITE_CLERK_PUBLISHABLE_KEY` is used
- Token getter function pattern
- Axios interceptor for Authorization header
- 401 retry logic

### 2. USER SYNC MECHANISM

**Backend files:**
- `sayloop-backend/src/modules/users/user.controller.js`
- `sayloop-backend/src/modules/users/user.service.js`
- `sayloop-backend/src/middleware/auth.middleware.js`

**Map out:**
- `POST /api/users/sync` endpoint
  - What data is sent: `{ email, firstName, lastName, pfpSource }`
  - Database upsert logic (find by clerkId or create)
  - What is returned to client
- localStorage pattern (db_user_id, clerk_id storage)
- Why two IDs? (Clerk external ID vs internal integer ID)

### 3. AUTH MIDDLEWARE CHAIN

**Analyze `auth.middleware.js` completely:**

```javascript
// Document each middleware function:
clerkAuth()      // What does it set on req?
resolveDbUser()  // How does it look up User?
protect()        // What does it check?
requireAuth()    // Difference from protect?
adminOnly()      // Is this implemented?
```

**Show the middleware stack for protected routes:**
```
Request → clerkAuth → resolveDbUser → protect → controller
```

### 4. COMPLETE SIGNUP FLOW

**Step-by-step sequence:**

```
1. User clicks /sign-up
2. Clerk Elements form
3. Email verification (Clerk-managed)
4. Redirect to /home or /onboarding?
5. Frontend: useAuthInit runs
   - calls POST /api/users/sync
   - stores localStorage values
   - initializes socket
6. OnboardingGuard checks metadata
7. If onboarding incomplete → /onboarding
8. OnboardingPage: 4-step flow
9. Updates Clerk unsafeMetadata
10. PUT /api/users/me with profile data
11. Navigate to /home
```

### 5. COMPLETE LOGIN FLOW

```
1. User at /sign-in
2. Clerk session created
3. Redirect to app
4. useAuthInit sequence
5. Token set in axios
6. Dashboard loads
```

### 6. ONBOARDING ANALYSIS

**Files:**
- `sayloop-frontend/src/page/OnBoarding/OnBoardingPage.tsx`
- `sayloop-frontend/src/components/modules/auth/NicknamePicker.tsx`

**Document 4 steps:**
1. Name + AI nickname suggestions (Gemini API call)
2. Profile photo upload
3. Learning language selection
4. Interest tags

**What data is saved where:**
- Clerk `unsafeMetadata.onboardingComplete`
- Backend User table fields

### 7. SOCKET AUTHENTICATION

**Analyze:**
- `sayloop-backend/src/server.js` socket auth middleware
- How token is passed: `handshake.auth.token`
- Fallback: `handshake.auth.clerkId`
- User verification flow
- `socket.dbUserId` assignment

### 8. ROUTE GUARDS

**Frontend:**
- `ProtectedRoute` - checks `isSignedIn`
- `OnboardingGuard` - checks onboarding complete
- Where are they used in routes?

### 9. TOKEN LIFECYCLE

**Document:**
- Token expiration (Clerk-managed)
- Refresh token flow (automatic)
- How axios handles 401
- Socket reconnection with new token

### 10. SECURITY ANALYSIS

**Identify:**
- What's secure (JWT verification)
- What's NOT secure (localStorage for IDs is convenience only)
- CSRF protection (or lack thereof)
- Rate limiting on auth endpoints
- `/api/debug/auth-check` - **SECURITY RISK** to remove

### OUTPUT FORMAT:

```markdown
# PHASE 2: AUTHENTICATION SYSTEM

## 1. Clerk Setup Guide
[Step-by-step Clerk dashboard setup]
[Getting publishable and secret keys]

## 2. Frontend Auth Implementation

### useAuthInit Hook
[Complete code with annotations]

### Axios Token Setup
[Interceptor pattern]

### Route Guards
[ProtectedRoute + OnboardingGuard implementation]

## 3. Backend Auth Middleware

### auth.middleware.js
[Each function explained with code]

### User Sync Service
[syncUser function complete implementation]

## 4. Complete Flow Diagrams

### Signup Flow
[Step-by-step with code snippets]

### Login Flow
[Step-by-step with code snippets]

### Onboarding Flow
[4 steps with metadata updates]

### Socket Auth Flow
[Handshake → verification → room join]

## 5. API Endpoints

POST /api/users/sync
GET /api/auth/me (if exists)
PUT /api/users/me

[Request/response examples for each]

## 6. Security Checklist
- [ ] JWT verified on all protected endpoints
- [ ] Socket auth working
- [ ] Debug endpoints removed
- [ ] CORS configured
- [ ] Rate limits on auth routes

## 7. Testing Auth
[Manual test script to verify each flow]

## 8. Common Auth Bugs & Fixes
[Known issues from codebase]

## Estimated Time: 3-4 hours
```

---

**Deliverables:**
1. Complete useAuthInit.ts code
2. Complete auth.middleware.js code
3. Signup/login/onboarding flow diagrams
4. Socket auth code
5. Test script for auth flows