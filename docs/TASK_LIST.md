# Family AI Scheduler – Solo Developer MVP Task List

**Developer:** 1 person  
**Budget:** $0 (free tiers only)  
**Updated:** March 11, 2026  
**Status:** Ready to execute

---

## Free Tier Stack (Zero Cost)

| Service                 | What It Gives You                     | Free Tier Limit                                       |
| ----------------------- | ------------------------------------- | ----------------------------------------------------- |
| **Supabase**            | DB + Auth + Edge Functions + Realtime | 500MB DB, 2 projects, 50k auth users                  |
| **OpenRouter**          | LLM API access (many models)          | Free credits on signup; use `google/gemini-flash-1.5` |
| **GitHub**              | Repo + Actions CI/CD                  | Unlimited public repos, 2,000 CI minutes/month        |
| **Vercel**              | Frontend hosting                      | Unlimited personal projects, 100GB bandwidth          |
| **Google Calendar API** | Calendar integration                  | Free for personal/low usage                           |

**Total monthly cost: $0**

---

## How to Read This List

- Tasks are in **execution order** — do them top to bottom
- `[BLOCKER]` = must finish before moving on
- `[PARALLEL]` = no dependency on adjacent tasks; do in any order within that group
- Effort is **solo-developer hours** (focused, no context switching)
- Items marked **SKIP-MVP** are cut for now — revisit after the core loop works

---

## Realistic Timeline (Solo, Part-Time Evenings/Weekends)

| Phase     | Focus                | Estimated Time            |
| --------- | -------------------- | ------------------------- |
| Phase 1   | Foundation & DB      | 1–2 weeks                 |
| Phase 2   | Calendar Integration | 2–3 weeks                 |
| Phase 3   | AI Agent & Conflicts | 2–3 weeks                 |
| Phase 4   | Frontend UI          | 2–3 weeks                 |
| Phase 5   | Polish & Deploy      | 1 week                    |
| **Total** |                      | **~8–10 weeks part-time** |

---

## Phase 1: Project Foundation

**Goal:** You can log in and see a working app shell. No AI yet — just the plumbing.

---

### 1.1 — Accounts & Services Setup

- [x] **TASK-001** `[BLOCKER]` `[30min]`
      **Create a free Supabase project**
  - Go to supabase.com → New Project → pick a region close to you
  - Save your project URL and `anon` key in a `.env.local` file
  - ✅ Done when: You can open the Supabase dashboard for your project

- [x] **TASK-002** `[30min]`
      **Create a free OpenRouter account**
  - Go to openrouter.ai → create account → get your API key
  - Store it in `.env.local` as `VITE_OPENROUTER_KEY` — never commit this file
  - Recommended free model: `google/gemini-flash-1.5`
  - ✅ Done when: You have an API key stored safely

- [x] **TASK-003** `[30min]`
      **Create GitHub repo**
  - New repo: `family-ai-scheduler`
  - Initialize with README and `.gitignore` (Node)
  - Add `.env.local` to `.gitignore` immediately
  - ✅ Done when: Repo is live and `.env.local` is gitignored

- [x] **TASK-004** `[30min]`
      **Register Google Cloud project (free)**
  - Go to console.cloud.google.com → create a project
  - Enable the **Google Calendar API**
  - ✅ Done when: Google Calendar API shows as "Enabled"

---

### 1.2 — React App Scaffold

- [x] **TASK-005** `[BLOCKER]` `[1hr]`
      **Bootstrap the React app with Vite**

  ```bash
  npm create vite@latest family-scheduler -- --template react-ts
  cd family-scheduler
  npm install @tanstack/react-query @supabase/supabase-js react-router-dom
  ```

  - Create `src/lib/supabase.ts` — initialize the Supabase client using your env vars
  - ✅ Done when: `npm run dev` shows the Vite page with no console errors

- [ ] **TASK-006** `[1hr]`
      **Create project folder structure**

  ```
  src/
    components/   ← reusable UI pieces
    pages/        ← full page components
    hooks/        ← custom React hooks (data fetching)
    lib/          ← supabase client, api helpers
    types/        ← TypeScript interfaces
  ```

  - Create placeholder `index.ts` in each folder
  - ✅ Done when: Folders exist; Supabase client in `src/lib/supabase.ts` imports cleanly

---

### 1.3 — Database Schema

> **Why first?** Your schema is the foundation everything else builds on. Getting it wrong early is the most expensive mistake you can make.

- [ ] **TASK-007** `[BLOCKER]` `[2hr]`
      **Create core database tables in Supabase SQL Editor**

  ```sql
  -- Family groups
  create table families (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    created_by uuid references auth.users(id),
    created_at timestamptz default now()
  );

  -- Family members (mom, dad, kids)
  create table family_members (
    id uuid primary key default gen_random_uuid(),
    family_id uuid references families(id) on delete cascade,
    name text not null,
    role text check (role in ('parent', 'child')),
    color text default '#6366f1',
    created_at timestamptz default now()
  );

  -- Calendar connections (one per Google/Outlook account)
  create table calendar_connections (
    id uuid primary key default gen_random_uuid(),
    family_member_id uuid references family_members(id) on delete cascade,
    provider text check (provider in ('google', 'outlook', 'apple')),
    calendar_name text,
    access_token text,
    refresh_token text,
    token_expires_at timestamptz,
    last_synced_at timestamptz,
    created_at timestamptz default now()
  );

  -- Events synced from calendars
  create table events (
    id uuid primary key default gen_random_uuid(),
    calendar_connection_id uuid references calendar_connections(id) on delete cascade,
    external_id text not null,
    title text not null,
    start_at timestamptz not null,
    end_at timestamptz not null,
    location text,
    description text,
    created_at timestamptz default now(),
    unique(calendar_connection_id, external_id)
  );

  -- Detected conflicts
  create table conflicts (
    id uuid primary key default gen_random_uuid(),
    family_id uuid references families(id) on delete cascade,
    event_a_id uuid references events(id) on delete cascade,
    event_b_id uuid references events(id) on delete cascade,
    conflict_type text check (conflict_type in ('hard_overlap', 'transport', 'preference')),
    severity text check (severity in ('high', 'medium', 'low')),
    resolved boolean default false,
    resolution_notes text,
    created_at timestamptz default now()
  );

  -- AI suggestions
  create table suggestions (
    id uuid primary key default gen_random_uuid(),
    family_id uuid references families(id) on delete cascade,
    content text not null,
    accepted boolean,
    created_at timestamptz default now()
  );

  -- Family preferences (dinner time, bedtime, etc.)
  create table family_preferences (
    id uuid primary key default gen_random_uuid(),
    family_id uuid references families(id) on delete cascade unique,
    dinner_time time default '18:00',
    bedtime_kids time default '20:00',
    bedtime_adults time default '22:00',
    notes text,
    updated_at timestamptz default now()
  );
  ```

  - ✅ Done when: All 7 tables exist in Supabase with no SQL errors

- [ ] **TASK-008** `[BLOCKER]` `[1hr]`
      **Enable Row-Level Security (RLS)**

  > Why: Without RLS, any authenticated user can read any other family's data. This is your security boundary.

  ```sql
  alter table families enable row level security;
  alter table family_members enable row level security;
  alter table calendar_connections enable row level security;
  alter table events enable row level security;
  alter table conflicts enable row level security;
  alter table suggestions enable row level security;
  alter table family_preferences enable row level security;

  create policy "family_owner_only" on families
    for all using (created_by = auth.uid());

  create policy "family_members_access" on family_members
    for all using (
      family_id in (select id from families where created_by = auth.uid())
    );

  create policy "calendar_access" on calendar_connections
    for all using (
      family_member_id in (
        select fm.id from family_members fm
        join families f on f.id = fm.family_id
        where f.created_by = auth.uid()
      )
    );

  create policy "events_access" on events
    for all using (
      calendar_connection_id in (
        select cc.id from calendar_connections cc
        join family_members fm on fm.id = cc.family_member_id
        join families f on f.id = fm.family_id
        where f.created_by = auth.uid()
      )
    );

  create policy "conflicts_access" on conflicts
    for all using (
      family_id in (select id from families where created_by = auth.uid())
    );

  create policy "suggestions_access" on suggestions
    for all using (
      family_id in (select id from families where created_by = auth.uid())
    );

  create policy "preferences_access" on family_preferences
    for all using (
      family_id in (select id from families where created_by = auth.uid())
    );
  ```

  - ✅ Done when: RLS enabled on all 7 tables; a test user cannot see another user's data

---

### 1.4 — Authentication

- [ ] **TASK-009** `[BLOCKER]` `[2hr]`
      **Build login and signup pages**
  - Create `src/pages/Login.tsx` and `src/pages/Signup.tsx`
  - Use `supabase.auth.signInWithPassword()` and `supabase.auth.signUp()`
  - Protected route wrapper: redirect to `/login` if no active session
  - ✅ Done when: You can create an account with email/password and log back in

- [ ] **TASK-010** `[1hr]`
      **Auto-create a family record on signup**
  - After `signUp()` succeeds, immediately insert:
    ```ts
    await supabase
      .from("families")
      .insert({ name: "My Family", created_by: user.id });
    ```
  - ✅ Done when: Every new user automatically has a family row

---

## Phase 2: Calendar Integration

**Goal:** Connect a real Google Calendar and see events appear in your app.

---

### 2.1 — Google OAuth Setup

- [ ] **TASK-011** `[BLOCKER]` `[1hr]`
      **Configure Google OAuth in Supabase**
  - In Google Cloud Console → APIs & Services → Credentials → Create OAuth 2.0 Client ID
  - Application type: Web application
  - Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
  - In Supabase dashboard → Authentication → Providers → Google → paste Client ID + Secret
  - ✅ Done when: Google is listed as an enabled provider in Supabase Auth

- [ ] **TASK-012** `[BLOCKER]` `[2hr]`
      **Build the "Connect Google Calendar" button**
  - Create `src/components/ConnectCalendar.tsx`
  - Trigger OAuth with calendar read scope:
    ```ts
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/calendar.readonly",
        redirectTo: window.location.origin + "/calendars",
      },
    });
    ```
  - After OAuth redirect returns, save tokens to `calendar_connections`
  - ✅ Done when: User clicks button, completes Google login, tokens appear in DB

---

### 2.2 — Event Sync

- [ ] **TASK-013** `[BLOCKER]` `[3hr]`
      **Create Supabase Edge Function: `sync-calendar`**
  - `supabase/functions/sync-calendar/index.ts`
  - Logic:
    1. Accept `{ family_member_id }` in the request body
    2. Fetch that member's `calendar_connections` row to get tokens
    3. If `token_expires_at < now()`: exchange refresh token for new access token via Google OAuth endpoint; update DB
    4. Call Google Calendar API: fetch events for next 30 days
    5. Upsert each event into `events` table (the `unique` constraint prevents duplicates)
  - ✅ Done when: Calling the function causes real calendar events to appear in your `events` table

- [ ] **TASK-014** `[2hr]`
      **Add "Sync Now" button to the UI**
  - On click: `supabase.functions.invoke('sync-calendar', { body: { family_member_id } })`
  - Show a loading spinner while it runs
  - On success: invalidate the TanStack Query cache so the calendar view refreshes
  - ✅ Done when: Click Sync → real events appear in the week view

---

## Phase 3: AI Agent & Conflict Detection

**Goal:** The app detects calendar conflicts and the AI can answer scheduling questions from your real data.

> **Key insight:** The AI does NOT detect conflicts — a deterministic SQL query does. The AI reads those results and explains them in plain English. This matters because LLMs make date arithmetic mistakes; SQL doesn't.

---

### 3.1 — Conflict Detection (No AI Needed Here)

- [ ] **TASK-015** `[BLOCKER]` `[2hr]`
      **Create Supabase Edge Function: `detect-conflicts`**
  - `supabase/functions/detect-conflicts/index.ts`
  - SQL: Find event pairs where the same person has overlapping times:
    ```sql
    select
      e1.id as event_a_id,
      e2.id as event_b_id,
      f.id as family_id
    from events e1
    join events e2
      on e1.id < e2.id
      and e1.start_at < e2.end_at
      and e1.end_at > e2.start_at
    join calendar_connections cc1 on cc1.id = e1.calendar_connection_id
    join calendar_connections cc2 on cc2.id = e2.calendar_connection_id
    join family_members fm on fm.id = cc1.family_member_id
    join families f on f.id = fm.family_id
    where cc1.family_member_id = cc2.family_member_id
      and e1.end_at > now()
    ```
  - Upsert results into the `conflicts` table
  - ✅ Done when: Overlapping test events produce rows in the `conflicts` table

- [ ] **TASK-016** `[1hr]`
      **Auto-run conflict detection after each sync**
  - At the end of `sync-calendar`, invoke `detect-conflicts`
  - ✅ Done when: Every calendar sync automatically updates the conflicts table

---

### 3.2 — AI Agent (Tool-Calling)

- [ ] **TASK-017** `[BLOCKER]` `[3hr]`
      **Create Supabase Edge Function: `agent`**
  - `supabase/functions/agent/index.ts`
  - Flow:
    1. Accept `{ family_id, message }` from the frontend
    2. Build system prompt (define the AI's role and constraints)
    3. Define 3 tool schemas in JSON:
       - `get_events(family_id, start_date, end_date)` → fetch events for a date range
       - `get_conflicts(family_id)` → fetch unresolved conflicts
       - `get_family_members(family_id)` → fetch member names + preferences
    4. POST to OpenRouter with user message + tool definitions
    5. If LLM response contains `tool_calls`: run the matching DB query, send results back to LLM
    6. Loop until `finish_reason === 'stop'`
    7. Return final text response to frontend
  - Use model: `google/gemini-flash-1.5` (free tier on OpenRouter)
  - ✅ Done when: You can ask "Do we have conflicts this week?" and get a real, data-grounded answer

- [ ] **TASK-018** `[2hr]`
      **Implement the 3 tool query functions**
  - `get_events` → `events` JOIN `calendar_connections` JOIN `family_members` filtered by date range
  - `get_conflicts` → `conflicts` JOIN `events` (include both event titles + times for context)
  - `get_family_members` → `family_members` JOIN `family_preferences`
  - Each returns small, structured JSON (only what the LLM needs — not full rows)
  - ✅ Done when: Each function returns correct data when tested with a real `family_id`

- [ ] **TASK-019** `[1hr]`
      **Write the agent system prompt**
  - Tell the AI:
    - It is a family scheduling assistant
    - It must use the provided tools to look up real data before answering
    - It should be warm, concise, and name specific events and times
    - It should flag conflicts clearly and suggest concrete alternatives
  - ✅ Done when: AI responses reference your actual event names and feel personal, not generic

---

## Phase 4: Frontend UI

**Goal:** A functional interface your family can actually use day-to-day.

> **Keep it simple.** Use Tailwind CSS. Ship working before beautiful.

---

### 4.1 — App Shell

- [ ] **TASK-020** `[BLOCKER]` `[2hr]`
      **Build the app layout**
  - `src/components/AppShell.tsx`
  - Left sidebar: Dashboard, Weekly Summary, Calendars, Family Settings
  - Top bar: family name + logout button
  - Main content renders the current page via React Router
  - ✅ Done when: All 4 nav links work without a full page reload

---

### 4.2 — Dashboard (Main Page)

- [ ] **TASK-021** `[BLOCKER]` `[3hr]`
      **Build the week view calendar**
  - `src/components/WeekView.tsx`
  - Show Monday–Sunday for the current week
  - Each event = colored block at the correct time slot (use `family_members.color`)
  - Use TanStack Query: `supabase.from('events').select(...).gte('start_at', weekStart).lte('end_at', weekEnd)`
  - Previous/Next week buttons
  - ✅ Done when: Your real synced events appear on the correct days and times

- [ ] **TASK-022** `[PARALLEL]` `[2hr]`
      **Build the conflicts panel**
  - `src/components/ConflictsPanel.tsx`
  - List unresolved conflicts for the current week
  - Each row: both event names, person affected, time overlap
  - "Mark resolved" button → sets `conflicts.resolved = true`
  - ✅ Done when: Real conflicts from your DB appear and can be dismissed

- [ ] **TASK-023** `[PARALLEL]` `[2hr]`
      **Build the AI chat interface**
  - `src/components/AIChat.tsx`
  - Text input + Send button
  - User messages right-aligned, AI responses left-aligned
  - On send: invoke the `agent` Edge Function; show spinner while waiting
  - ✅ Done when: You can ask a scheduling question and get a real AI response about your calendar

---

### 4.3 — Family Setup

- [ ] **TASK-024** `[BLOCKER]` `[2hr]`
      **Build the family settings page**
  - `src/pages/FamilySettings.tsx`
  - Edit family name
  - Add/remove family members (name, role, color)
  - Set dinner time + bedtime preferences
  - ✅ Done when: You can add your real family members and see their names/colors in the week view

- [ ] **TASK-025** `[PARALLEL]` `[1hr]`
      **Build the calendars management page**
  - `src/pages/Calendars.tsx`
  - List connected calendars + last sync time
  - "Connect Google Calendar" button (from TASK-012)
  - "Sync Now" button (from TASK-014)
  - ✅ Done when: Connected calendars are listed and you can trigger a manual sync

---

### 4.4 — Weekly Summary

- [ ] **TASK-026** `[2hr]`
      **Build the weekly summary page**
  - `src/pages/WeeklySummary.tsx`
  - On load: call agent with prompt:
    `"Summarize our family's upcoming week. List all events by person and day, flag conflicts, and suggest anything we should plan or discuss."`
  - Display AI response as formatted text
  - "Regenerate" button to get a fresh summary
  - ✅ Done when: The page shows a real, useful AI-written summary of your actual week

---

## Phase 5: Polish & Deploy

**Goal:** The app is stable, live on the internet, and usable from your phone.

---

- [ ] **TASK-027** `[2hr]`
      **Deploy frontend to Vercel (free)**
  - Connect your GitHub repo to vercel.com
  - Add all `.env.local` variables to Vercel's Environment Settings
  - ✅ Done when: App has a live public URL (e.g., `family-scheduler.vercel.app`)

- [ ] **TASK-028** `[1hr]`
      **Add basic error handling**
  - Show a toast notification when any API call fails (not a blank screen)
  - Show a spinner on AI loading states
  - ✅ Done when: The app never shows a blank white screen when something goes wrong

- [ ] **TASK-029** `[2hr]`
      **Make it mobile-friendly**
  - Sidebar collapses to a hamburger menu on small screens
  - Week view scrolls horizontally on mobile
  - All buttons are at least 44px tall (finger-friendly)
  - Test in Chrome DevTools mobile emulator
  - ✅ Done when: The app is usable on your phone

- [ ] **TASK-030** `[1hr]`
      **Add onboarding screen for empty state**
  - If user has no connected calendars: show a "Get Started" guide
  - 3 steps: Add family members → Connect a calendar → Ask the AI
  - ✅ Done when: A new account sees helpful guidance instead of an empty dashboard

---

## Things to SKIP for MVP

These were in the original 87-task plan but are not needed for a working product when you're solo with $0.

| Feature                   | Why to Skip                        | Revisit When                |
| ------------------------- | ---------------------------------- | --------------------------- |
| Outlook + Apple Calendar  | Google proves the concept          | After MVP works             |
| Auto-sync every 5 min     | Manual "Sync Now" is fine          | If you want real-time feel  |
| Email/push reminders      | In-app visibility is enough        | After first users           |
| Rate limiting             | You're the only user               | Before opening to others    |
| GDPR data export          | No real users yet                  | Before marketing            |
| CI/CD pipeline            | Vercel auto-deploys from GitHub    | When deploys get frequent   |
| Automated tests           | Write tests once the app works     | Before adding contributors  |
| Analytics/monitoring      | Supabase dashboard covers you      | When you have real users    |
| PDF/email weekly export   | In-app view is fine for now        | If users ask for it         |
| Multiple calendar sources | One is plenty to validate the idea | After Google Calendar works |

---

## Your Immediate Next Step

Open Supabase, create a project, and complete **TASK-001 through TASK-010**. That's roughly 4–5 hours of focused work. By the end you'll have:

- A Supabase project live
- A React app that boots locally
- A correctly structured database with security
- Working login/signup

Every other task in this list depends on those 10 being done first.

---

## The North Star

> Build the simplest version that proves this one loop works end-to-end:
>
> **Connect Calendar → Sync Events → Detect Conflicts → Ask the AI About Them**
>
> Once that loop works with your real family's real data, you have an MVP.
