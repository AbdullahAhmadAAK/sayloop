# PHASE 3: DATABASE SCHEMA & PRISMA ANALYSIS

**Goal:** Document complete database schema, relationships, and migration strategy

**Give this prompt to your AI with the SayLoop codebase:**

---

You are analyzing the SayLoop database to create rebuild documentation for **Phase 3: Database**.

## YOUR TASK:

### 1. PRISMA SCHEMA ANALYSIS

**File:** `sayloop-backend/src/prisma/schema.prisma`

**For EVERY model, document:**

#### User Model
```prisma
model User {
  // List every field with:
  // - Type
  // - Constraints (unique, optional, default)
  // - Purpose
  // - Used where in code
}
```

**Critical fields to explain:**
- `clerkId` - external auth ID
- `points` vs `xp` - **DUAL ECONOMY WARNING**
- `xpThisWeek` - weekly leaderboard
- `streakLength` + `lastActiveDate` - streak logic
- `learningLanguage`, `interests` - matching filters
- `level`, `gems` - gamification

#### Match Model
```prisma
model Match {
  // All fields
  // Status enum values
  // Relationships to User (requester/receiver)
  // sessionId generation pattern
}
```

**Match status flow:**
```
PENDING → ACCEPTED → CONFIRMED → IN_SESSION → COMPLETED
  ↓           ↓
REJECTED   EXPIRED
           ABANDONED
```

#### Economy Models
- `XPTransaction` - audit log
- `GemTransaction` - audit log
- List all `XPReason` enum values
- List all `GemReason` enum values

#### Curriculum Models (if they exist)
- `Course`
- `Section`
- `Unit`
- `Lesson`
- `Exercise`
- `ExerciseOption`
- `ExerciseAttempt`
- `LessonCompletion`

**Note:** These may exist in schema but not be fully wired in app.

### 2. RELATIONSHIPS MAP

Create an ER diagram in text:

```
User (1) ──< (many) Match [as requester]
User (1) ──< (many) Match [as receiver]
User (1) ──< (many) XPTransaction
User (1) ──< (many) GemTransaction
User (1) ──< (many) Follow [as follower]
User (1) ──< (many) Follow [as following]
Course (1) ──< (many) Section
Section (1) ──< (many) Unit
Unit (1) ──< (many) Lesson
...
```

### 3. INDEXES ANALYSIS

**List all indexes from schema:**
- Which fields are indexed?
- Why? (query optimization for what?)
- Composite indexes?

Example:
```
@@index([xp(sort: Desc)]) // For leaderboard ranking
@@index([xpThisWeek(sort: Desc)]) // Weekly leaderboard
```

### 4. DATABASE CONNECTION SETUP

**Analyze:**
- `sayloop-backend/src/config/database.js`
- `DATABASE_URL` pooled connection (Neon pooler)
- `DIRECT_URL` direct connection (migrations)
- `getDb()` function pattern
- `connectWithRetry()` logic

**Why two URLs?**
Neon pooler breaks some Prisma migrate commands; direct connection needed for DDL.

### 5. MIGRATION STRATEGY

**Document:**
```bash
# Development
npm run migrate          # What does this do?
npm run studio           # Prisma Studio

# Production
npm run build            # Includes prisma generate + migrate deploy
```

**Where are migrations stored?**
- `sayloop-backend/src/prisma/migrations/`

### 6. SEED DATA ANALYSIS

**File:** `sayloop-backend/src/prisma/seed.js`

**What data is seeded?**
- Courses, Sections, Units, Lessons?
- QuestDefinitions?
- How to run seed: `npm run seed`

### 7. QUERY PATTERNS

**Find and document common queries in codebase:**

**User queries:**
```javascript
// Browse partners
prisma.user.findMany({
  where: { learningLanguage: ... },
  orderBy: { xp: 'desc' },
  take: 20
})
```

**Match queries:**
```javascript
// Accept match (atomic)
prisma.match.updateMany({
  where: { id: matchId, status: 'PENDING' },
  data: { status: 'ACCEPTED', sessionId: ... }
})
```

**Economy queries:**
```javascript
// Award XP
prisma.$transaction([
  prisma.user.update({ where: { id }, data: { xp: { increment: amount }}}),
  prisma.xPTransaction.create({ data: { userId, amount, reason }})
])
```

### 8. DATA INTEGRITY CONCERNS

**Identify:**
- Foreign key constraints (or lack thereof)
- Cascade deletes configured?
- Unique constraints
- Required vs optional fields that should be required

### 9. DUAL ECONOMY WARNING

**Document the conflict:**

| System | Fields | Used where |
|--------|--------|-----------|
| Legacy | `points`, `submissions` | Old xpService, leaderboard |
| Current | `xp`, `gems`, `level` | session.socket economy |

**Rebuild decision:** Use **xp only**, migrate or drop points.

### 10. COMPLETE TABLE REFERENCE

**For each table, provide:**

| Table | Purpose | Key Fields | Created By | Read By | Updated By |
|-------|---------|------------|------------|---------|------------|
| User | Account data | clerkId, xp, streak | sync | many | economy, match |
| Match | Match requests | status, topic, outcome | match.service | match pages | session |
| XPTransaction | Audit log | userId, amount, reason | economy | stats | never |
| ... | ... | ... | ... | ... | ... |

### OUTPUT FORMAT:

```markdown
# PHASE 3: DATABASE SCHEMA

## 1. Complete Prisma Schema
[Annotated schema.prisma with every field explained]

## 2. ER Diagram
[Text-based relationship map]

## 3. Database Setup Guide

### Neon PostgreSQL
[Create database, get URLs]

### Prisma Setup
[Install, configure, first migration]

### Running Migrations
[Dev and prod commands]

## 4. Model Deep Dives

### User Model
[Every field, constraints, purpose]

### Match Model
[Status flow, relationships]

### Economy Models
[XP/Gem transaction patterns]

### Curriculum Models (if applicable)
[Course → Lesson hierarchy]

## 5. Query Patterns & Optimization
[Common queries with indexes]

## 6. Seed Data
[What's seeded, how to run]

## 7. Database Checklist
- [ ] Schema created
- [ ] Indexes optimized
- [ ] Migrations run
- [ ] Seed data loaded (optional)
- [ ] Connection pooling configured

## 8. Known Issues
- Dual economy (points vs xp)
- Missing foreign key constraints?
- Fields that should be required

## Estimated Time: 2-3 hours
```

---

**Deliverables:**
1. Complete annotated schema.prisma
2. SQL schema export (for reference)
3. database.js connection code
4. Migration commands cheat sheet
5. Sample queries for all major operations