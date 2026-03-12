# Family AI Scheduler

An AI-powered family schedule coordination system that aggregates multiple calendars, detects conflicts, and provides intelligent optimization suggestions — reducing the mental load of managing a busy family's week.

---

## Problem

Families manage schedules across parents, children, school events, sports, and appointments. Most calendar tools only store events — they don't actively help coordinate or optimize schedules.

**Key pain points:**

- Parents manually detect scheduling conflicts
- Coordinating transportation and activities is time-consuming
- Important events are missed across fragmented calendars
- Busy parents carry the entire mental load of planning

---

## What It Does

- **Aggregates** multiple family calendars (Google, Apple, Outlook) into a single unified view
- **Detects conflicts** automatically — hard overlaps, transportation gaps, and preference violations
- **Generates AI suggestions** to optimize the week (e.g. "Plan so kids attend soccer and you still have 3 family dinners")
- **Sends smart reminders** at 24 hrs, 2 hrs, and day-of for important events
- **Produces weekly summaries** every Sunday with a prioritized plan for the week ahead

---

## Tech Stack

| Layer         | Technology                                   |
| ------------- | -------------------------------------------- |
| Frontend      | React 19, TypeScript, Vite, TanStack Query   |
| Backend       | Supabase (Postgres + Auth + Edge Functions)  |
| AI / LLM      | OpenRouter → `google/gemini-flash-1.5`       |
| Hosting       | Vercel (frontend), Supabase (backend)        |
| Calendar APIs | Google Calendar API, iCloud, Microsoft Graph |

> **Total monthly cost: $0** — built entirely on free tiers.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                  Frontend                   │
│         React + TanStack Query              │
└───────────────────┬─────────────────────────┘
                    │
┌───────────────────▼─────────────────────────┐
│              Supabase Backend               │
│     Postgres DB · Auth · Edge Functions     │
└───────────────────┬─────────────────────────┘
                    │
┌───────────────────▼─────────────────────────┐
│                AI Layer                     │
│   Agent Orchestrator → Tool-calling loop    │
│         LLM via OpenRouter                  │
└─────────────────────────────────────────────┘
```

### AI Agent Tools

| Tool                    | Purpose                                           |
| ----------------------- | ------------------------------------------------- |
| `CalendarReaderTool`    | Fetch events from connected calendars             |
| `ConflictDetectionTool` | Find overlapping or incompatible events           |
| `ScheduleOptimizerTool` | Suggest improved, conflict-free schedules         |
| `ReminderTool`          | Send timely notifications to family members       |
| `FamilyContextTool`     | Store/retrieve preferences (dinner time, bedtime) |

---

## Database Schema (Core Tables)

| Table                  | Description                                        |
| ---------------------- | -------------------------------------------------- |
| `families`             | Family group record                                |
| `family_members`       | Individual members with role and color             |
| `calendar_connections` | OAuth tokens per calendar provider per member      |
| `events`               | Synced events from all connected calendars         |
| `conflicts`            | Detected conflicts with type and severity          |
| `suggestions`          | AI-generated schedule improvement suggestions      |
| `family_preferences`   | Stored rules (dinner time, bedtime, commute times) |

---

## Project Structure

```
family_ai_scheduler/
├── docs/                        # Product docs, specs, and plans
│   ├── family_ai_scheduler_PRD.md
│   ├── MVP_SPECIFICATION.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── TASK_LIST.md
│   └── AI_PRODUCT_CONTEXT.md
└── family-scheduler/            # React app (Vite + TypeScript)
    ├── src/
    │   ├── components/          # Reusable UI components
    │   ├── pages/               # Full page views
    │   ├── hooks/               # Custom React hooks
    │   ├── lib/                 # Supabase client and API helpers
    │   └── types/               # TypeScript interfaces
    ├── package.json
    └── vite.config.ts
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A free [Supabase](https://supabase.com) project
- A free [OpenRouter](https://openrouter.ai) API key
- A [Google Cloud](https://console.cloud.google.com) project with Google Calendar API enabled

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/your-username/family-ai-scheduler.git
cd family-ai-scheduler/family-scheduler

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local
# Fill in your Supabase URL, anon key, and OpenRouter API key

# 4. Start the dev server
npm run dev
```

> Never commit `.env.local` — it is already in `.gitignore`.

### Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENROUTER_KEY=your-openrouter-key
```

---

## Development Roadmap

| Phase | Focus                      | Status      |
| ----- | -------------------------- | ----------- |
| 1     | Project foundation & DB    | In Progress |
| 2     | Calendar integration       | Not Started |
| 3     | AI agent & conflict engine | Not Started |
| 4     | Frontend UI                | Not Started |
| 5     | Polish & deploy            | Not Started |

See [docs/TASK_LIST.md](docs/TASK_LIST.md) for the full task breakdown and [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) for detailed architecture decisions.

---

## Future Features

- Meal planning integration
- School event auto-import
- Transportation coordination
- Voice assistant integration
- Grocery list generation

---

## Learning Goals

This project is also a hands-on learning platform for:

- AI agent architecture and tool-calling patterns
- Full-stack development with Supabase
- MCP (Model Context Protocol) integrations
- Building real AI-assisted products end-to-end
