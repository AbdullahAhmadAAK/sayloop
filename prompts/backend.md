# PHASE 4: BACKEND API & ROUTING ANALYSIS

**Goal:** Document all REST API endpoints, middleware, and request/response patterns

**Give this prompt to your AI with the SayLoop codebase:**

---

You are analyzing the SayLoop backend API to create rebuild documentation for **Phase 4: API System**.

## YOUR TASK:

### 1. EXPRESS APP STRUCTURE

**Files:**
- `sayloop-backend/src/app.js`
- `sayloop-backend/src/server.js`

**Document:**
- How Express app is created
- Middleware chain order (morgan, cors, express.json, routes, error handler)
- CORS configuration (`FRONTEND_URL`)
- Route mounting pattern
- Error handling middleware

```javascript
// Middleware order matters:
1. Morgan logging
2. CORS
3. express.json()
4. Routes
5. 404 handler
6. Error handler
```

### 2. COMPLETE API ENDPOINT CATALOG

**For EVERY endpoint in the codebase, create this table:**

| Method | Path | Auth | Request Body | Response | File Location |
|--------|------|------|--------------|----------|---------------|
| GET | `/` | No | - | `{ message: "SayLoop API", status: "healthy" }` | app.js |
| POST | `/api/users/sync` | clerkAuth | `{ email, firstName?, lastName?, pfpSource? }` | User object | user.controller |
| GET | `/api/users/me` | protect | - | Current user | user.controller |
| ... | ... | ... | ... | ... | ... |

### 3. MODULE-BY-MODULE BREAKDOWN

**For each module in `sayloop-backend/src/modules/`:**

#### Users Module
- `user.route.js` - all routes
- `user.controller.js` - all controller functions
- `user.service.js` - all service functions
- `user.validation.js` - Zod schemas

**Document each endpoint:**

```markdown
#### POST /api/users/sync

**Purpose:** Sync Clerk user to local database

**Auth:** ClerkAuth middleware

**Request Body:**
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "pfpSource": "https://..."
}
```

**Controller Logic:**
1. Extract clerkId from req.auth.userId
2. Call user.service.syncUser()
3. Upsert user by clerkId
4. Return user object

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "clerkId": "user_...",
    "email": "...",
    ...
  }
}
```

**Error 500:**
```json
{
  "success": false,
  "error": "Database error"
}
```

**Service Function:**
```javascript
async function syncUser(clerkId, userData) {
  return prisma.user.upsert({
    where: { clerkId },
    create: { clerkId, ...userData },
    update: { ...userData }
  });
}
```
```

**Repeat for:**
- GET `/me`
- PUT `/me`
- GET `/me/stats`
- GET `/browse`

#### Match Module
- POST `/api/matches/find` - send match request
- GET `/api/matches/active` - active matches for user
- GET `/api/matches/history` - paginated history
- GET `/api/matches/:matchId` - single match detail
- POST `/api/matches/:matchId/accept` - accept request
- POST `/api/matches/:matchId/reject` - reject request

#### Sessions Module
- GET `/api/sessions/history` - legacy lesson completions
- POST `/api/sessions/result` - legacy points (document if still used)

#### Economy Module
- GET `/api/economy/summary` - xp, gems, level, streak
- GET `/api/economy/transactions` - XP transaction history
- GET `/api/economy/leaderboard` - rankings
- POST `/api/economy/spend-gems` - deduct gems

#### Leaderboard Module
- GET `/api/leaderboard/paginated` - page of users
- GET `/api/leaderboard/top` - top N users
- GET `/api/leaderboard/rank/:userId` - user's rank

#### Profiles Module
- GET `/api/profiles/search` - partner search
- GET `/api/profiles/:userId` - **PUBLIC** profile (no auth)
- GET `/api/profiles/:userId/stats` - protected stats

#### AI Module
- POST `/api/ai/name-suggestions` - Gemini nickname generation
- GET `/api/ai/topics` - static topic list

#### Hearts Module (buggy)
- GET `/api/hearts/:userId/status`
- POST `/api/hearts/:userId/use`
- POST `/api/hearts/:userId/refill`
**NOTE:** Controller has bug: uses `req.user.dbId` instead of `req.dbUserId`

#### Levels Module
- Empty router - **not implemented**

### 4. MIDDLEWARE ANALYSIS

**Files in `sayloop-backend/src/middleware/`:**

#### auth.middleware.js
- `clerkAuth()` - Clerk JWT verification
- `resolveDbUser()` - Look up User by clerkId
- `protect()` - Require authenticated user
- `requireAuth()` - Alias for protect
- `adminOnly()` - **501 Not Implemented**

#### validate.middleware.js
- `validate(schema)` - Zod validation wrapper
- How to use with Zod schemas

#### rateLimit.middleware.js
- Global rate limit
- Auth route limits
- Browse endpoint limits

#### error.middleware.js
- Error handler structure
- Response format

#### logger.middleware.js
- Morgan setup

### 5. VALIDATION SCHEMAS

**For each module with validation:**

```javascript
// Example from user.validation.js
const updateProfileSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  firstName: z.string().optional(),
  // ...
});
```

List all validation schemas and their rules.

### 6. SERVICE LAYER PATTERNS

**Document common patterns:**

**CRUD pattern:**
```javascript
// Create
async function create(data) {
  return prisma.model.create({ data });
}

// Read
async function findById(id) {
  return prisma.model.findUnique({ where: { id }});
}

// Update
async function update(id, data) {
  return prisma.model.update({ where: { id }, data });
}
```

**Transaction pattern:**
```javascript
async function awardXP(userId, amount, reason) {
  return prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: amount }}
    }),
    prisma.xPTransaction.create({
      data: { userId, amount, reason }
    })
  ]);
}
```

### 7. ERROR HANDLING

**Document:**
- Error response format
- HTTP status codes used
- Prisma error handling
- Custom error classes (if any)

### 8. PAGINATION PATTERN

**Analyze `utils/paginate.js`:**
- How pagination works
- Default page size
- Response format with metadata

### 9. API TESTING REFERENCE

**For rebuild testing, provide:**

```bash
# Sync user
curl -X POST http://localhost:4000/api/users/sync \
  -H "Authorization: Bearer $CLERK_JWT" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Send match request
curl -X POST http://localhost:4000/api/matches/find \
  -H "Authorization: Bearer $CLERK_JWT" \
  -d '{"userId":1,"partnerId":2,"topic":"travel"}'

# Accept match
curl -X POST http://localhost:4000/api/matches/123/accept \
  -H "Authorization: Bearer $CLERK_JWT"
```

### OUTPUT FORMAT:

```markdown
# PHASE 4: BACKEND API SYSTEM

## 1. Express App Setup
[app.js + server.js explanation]

## 2. Complete API Reference

### Users API
[All endpoints with examples]

### Matches API
[All endpoints with examples]

### Sessions API
[All endpoints with examples]

### Economy API
[All endpoints with examples]

### Leaderboard API
[All endpoints with examples]

### Profiles API
[All endpoints with examples]

### AI API
[All endpoints with examples]

## 3. Middleware Reference
[Each middleware explained with code]

## 4. Validation Schemas
[All Zod schemas]

## 5. Service Layer Patterns
[Common patterns with examples]

## 6. Error Handling
[Error format and status codes]

## 7. Testing Guide
[curl commands for each endpoint]

## 8. API Checklist
- [ ] All routes mounted
- [ ] Auth middleware working
- [ ] Validation on all inputs
- [ ] Error handling consistent
- [ ] Rate limiting enabled

## 9. Known API Bugs
- Hearts controller uses wrong field
- Debug endpoint to remove
- Empty levels module

## Estimated Time: 4-5 hours
```

---

**Deliverables:**
1. Complete API endpoint table
2. Request/response examples for every endpoint
3. Middleware code with annotations
4. Validation schema reference
5. Postman/curl test collection
6. Service layer template code