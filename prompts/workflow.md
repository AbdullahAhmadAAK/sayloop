# PHASE 5: FRONTEND CORE & REDUX ANALYSIS

**Goal:** Document React app structure, routing, state management, and UI components

**Give this prompt to your AI with the SayLoop codebase:**

---

You are analyzing the SayLoop frontend to create rebuild documentation for **Phase 5: Frontend Core**.

## YOUR TASK:

### 1. APP INITIALIZATION

**Files:**
- `sayloop-frontend/src/main.tsx`
- `sayloop-frontend/src/App.tsx`

**Document provider hierarchy:**
```jsx
<React.StrictMode>
  <ClerkProvider publishableKey={...}>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </ClerkProvider>
</React.StrictMode>
```

**App.tsx responsibilities:**
- `useAuthInit` hook
- `usePageTracking` hook
- Routes component
- LevelUpModal (global)

### 2. ROUTING SYSTEM

**File:** `sayloop-frontend/src/components/routes/routes.tsx`

**Document all routes:**

| Path | Component | Guard | Description |
|------|-----------|-------|-------------|
| `/` | MarketingPage | Public | Landing |
| `/sign-in/*` | Clerk SignIn | Public | Login |
| `/sign-up/*` | Clerk SignUp | Public | Signup |
| `/onboarding` | OnBoardingPage | ProtectedRoute | 4-step setup |
| `/home` | HomePage | OnboardingGuard | Dashboard |
| `/learn` | LearnPage | OnboardingGuard | Curriculum |
| `/match` | MatchPage | OnboardingGuard | Browse partners |
| `/session` | SessionPage | OnboardingGuard | Live debate |
| `/leaderboard` | LeaderboardPage | OnboardingGuard | Rankings |
| `/quests` | QuestsPage | OnboardingGuard | Daily quests |
| `/shop` | ShopPage | OnboardingGuard | Gem shop |
| `/profile` | ProfilePage | OnboardingGuard | User profile |
| `/more` | MorePage | OnboardingGuard | Settings menu |

### 3. ROUTE GUARDS

**ProtectedRoute:**
```jsx
function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Navigate to="/sign-in" />;
  return children;
}
```

**OnboardingGuard:**
```jsx
function OnboardingGuard({ children }) {
  const { user } = useUser();
  const onboardingComplete = user?.unsafeMetadata?.onboardingComplete;
  if (!onboardingComplete) return <Navigate to="/onboarding" />;
  return children;
}
```

**GlobalMatchWatcher:**
- Where is it rendered?
- What does it watch? (`match.notification`)
- Overlay behavior

### 4. REDUX STORE STRUCTURE

**File:** `sayloop-frontend/src/redux/store.ts`

**List all slices:**
1. `match` - matching state machine
2. `session` - debate state
3. `economy` - xp, gems, level, streak
4. `profile` - user profile
5. `leaderboard` - rankings
6. `partners` - **unused duplicate of match?**

**For each slice, document:**
- Initial state
- Actions (reducers)
- Selectors
- Which components use it

### 5. REDUX-SAGA ANALYSIS

**Files in `sayloop-frontend/src/redux/saga/`:**

**For each saga:**

**match.saga.ts:**
```javascript
// Sagas:
- initMatchSocket() - register all socket listeners ONCE
- sendRequest(action) - POST /api/matches/find
- acceptRequest(action) - POST /api/matches/:id/accept
- rejectRequest(action) - POST /api/matches/:id/reject
- confirmReady(action) - emit 'match:confirm-ready'
- loadRequests() - GET /api/matches/active

// Socket listeners:
- 'match:request-received'
- 'match:accepted'
- 'match:rejected'
- 'match:session-start'
- 'match:badge_count'
```

**session.saga.ts:**
- Session-related sagas

**economy.saga.ts:**
- `FETCH_ECONOMY` - GET /api/economy/summary
- Listen for `economy:update` and `level_up` socket events

### 6. SOCKET SERVICE

**File:** `sayloop-frontend/src/redux/service/socket.service.ts`

**Document:**
- Singleton pattern
- `getOrCreateSocket()` function
- Connection setup with token + clerkId
- `page:join` / `page:leave` events
- How to emit events
- How to listen to events

### 7. LAYOUT COMPONENTS

**PageShell:**
- Responsive wrapper
- Sidebar (desktop)
- TopBar (mobile)
- Main content area
- Rightsidebar

**Sidebar:**
- Navigation links
- XP/streak display
- Pending match badge

**Rightsidebar:**
- Economy widgets (gems, hearts, streak)

### 8. HOOKS ANALYSIS

**useAuthInit:**
```javascript
// On mount:
1. setTokenGetter for axios
2. POST /api/users/sync
3. Store db_user_id, clerk_id
4. dispatch FETCH_ECONOMY
5. dispatch loadRequests
6. dispatch initMatchSocket
```

**usePageTracking:**
- Analytics? Page title updates?

### 9. LIB UTILITIES

**axiosInstance.ts:**
- Base URL setup
- Token interceptor
- 401 retry logic

**matchApi.ts:**
- API functions for match operations

### 10. CONSTANTS

**topics.ts:**
- Frontend topic definitions matching backend

### OUTPUT FORMAT:

```markdown
# PHASE 5: FRONTEND CORE

## 1. App Initialization
[main.tsx + App.tsx setup]

## 2. Complete Routing Map
[All routes with guards]

## 3. Route Guards
[ProtectedRoute + OnboardingGuard code]

## 4. Redux Store

### Store Setup
[store.ts configuration]

### Slices Reference
[Each slice with state shape, actions, selectors]

### Saga Patterns
[Each saga explained]

## 5. Socket Integration
[socket.service.ts + saga listeners]

## 6. Layout System
[PageShell, Sidebar, Rightsidebar]

## 7. Hooks
[useAuthInit complete flow]

## 8. API Client
[axios setup + interceptors]

## 9. Frontend Checklist
- [ ] Routes configured
- [ ] Guards working
- [ ] Redux store setup
- [ ] Sagas running
- [ ] Socket connected
- [ ] Auth init flow complete

## Estimated Time: 4-5 hours
```