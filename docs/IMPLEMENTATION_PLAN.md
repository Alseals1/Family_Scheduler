# Family AI Scheduler – Comprehensive Implementation Plan

**Version:** 1.0  
**Date:** March 11, 2026  
**Status:** Ready for Implementation  
**Audience:** Development team, architects, stakeholders

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture & Design](#architecture--design)
3. [Integration Points](#integration-points)
4. [Tool Design](#tool-design)
5. [Phase Breakdown](#phase-breakdown)
6. [Key Milestones](#key-milestones)
7. [Known Constraints](#known-constraints)
8. [Open Questions](#open-questions)
9. [Risk Register](#risk-register)

---

## Executive Summary

This implementation plan outlines the technical approach to build the Family AI Scheduler MVP—an AI-powered family schedule coordination system. The system aggregates multiple calendar sources, detects conflicts, and provides AI-generated optimization suggestions through an agent-based architecture.

**Key Principles:**

- **Agent-First Design:** All intelligence flows through tool-calling agents; UI is agent-driven
- **Progressive Sync:** Calendar sync begins simple (5-minute polling) and scales to webhooks later
- **Tool Composition:** Small, composable tools enable both agent and UI to function independently
- **Data Separation:** User data (schedules) and system state (conflicts, suggestions) remain normalized for independent evolution
- **Learning-Focused:** Architecture emphasizes clear separation of concerns for teaching AI agent patterns

**Success Indicators:**

- All features functional and team can demonstrate tool-calling loops
- <2second calendar load times with 5+ calendars
- AI suggestions generated in <10 seconds
- System reliably detects 100% of hard conflicts

---

## Architecture & Design

### 1. Frontend Architecture

#### 1.1 Component Structure

```
src/
├── components/
│   ├── Layout/
│   │   ├── AppShell.tsx          # Main layout wrapper
│   │   ├── Sidebar.tsx            # Navigation + family selector
│   │   └── Topbar.tsx             # Alerts, settings, user menu
│   │
│   ├── Calendar/
│   │   ├── WeekView.tsx           # Primary schedule view (by day/time)
│   │   ├── EventCard.tsx          # Individual event display
│   │   ├── ConflictBadge.tsx      # Conflict indicators + quick info
│   │   ├── CalendarFilter.tsx     # Show/hide by family member or type
│   │   └── EventManager.tsx       # Create/edit event drafts (no direct save)
│   │
│   ├── Conflicts/
│   │   ├── ConflictPanel.tsx      # Sidebar showing active conflicts
│   │   ├── ConflictDetail.tsx     # Conflict breakdown with details
│   │   └── ResolutionCard.tsx     # Individual suggestion cards
│   │
│   ├── Suggestions/
│   │   ├── SuggestionFeed.tsx     # Timeline of recent suggestions
│   │   ├── SuggestionCard.tsx     # Individual suggestion display
│   │   └── QuickApplyButton.tsx   # One-click suggestion acceptance
│   │
│   ├── Weekly/
│   │   ├── WeeklySummary.tsx      # Sunday summary view
│   │   ├── SummarySection.tsx     # Each section (conflicts, transportation, etc.)
│   │   └── SummaryExport.tsx      # Print/download controls
│   │
│   ├── Reminders/
│   │   ├── ReminderCenter.tsx     # Upcoming reminders dashboard
│   │   ├── ReminderCard.tsx       # Individual reminder display
│   │   └── ReminderPreferences.tsx # User reminder settings
│   │
│   ├── Family/
│   │   ├── FamilySettings.tsx     # Family setup + member management
│   │   ├── MemberCard.tsx         # Edit individual member
│   │   ├── CalendarConnect.tsx    # OAuth flows for calendar connection
│   │   └── PreferencesForm.tsx    # Dinner time, bedtime, rules, etc.
│   │
│   └── Common/
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       ├── Modal.tsx
│       └── Toast.tsx
│
├── hooks/
│   ├── useFamily.ts              # Family + member data
│   ├── useCalendars.ts           # Calendar events + sync status
│   ├── useConflicts.ts           # Conflict detection state
│   ├── useSuggestions.ts         # Optimization suggestions
│   ├── useReminders.ts           # Reminder state + preferences
│   └── useAuth.ts                # Authentication state
│
├── stores/
│   ├── familyStore.ts            # Family data + members (Zustand/TanStack Query)
│   ├── calendarStore.ts          # Event cache + sync status
│   ├── conflictStore.ts          # Active conflicts + history
│   ├── suggestionStore.ts        # Suggestions + user feedback
│   └── uiStore.ts                # UI state (filters, modals, etc.)
│
├── services/
│   ├── api.ts                     # API client + request handlers
│   ├── auth.service.ts            # Auth logic (Supabase client)
│   ├── calendar.service.ts        # Calendar sync orchestration
│   └── agent.service.ts           # Agent invocation + result handling
│
└── pages/
    ├── Dashboard.tsx              # Main calendar + conflicts view
    ├── Weekly.tsx                 # Weekly summary view
    ├── Suggestions.tsx            # Suggestion feed
    ├── Reminders.tsx              # Reminder center
    ├── Settings.tsx               # Family + preferences + account
    └── Auth.tsx                   # Login/signup flow
```

#### 1.2 Data Flow Architecture

```
User Action (click event, open summary)
  ↓
React Component
  ↓
TanStack Query (fetch/refetch)
  ↓
API Service (HTTP request to Backend)
  ↓
[Backend processes request]
  ↓
TanStack Query Cache Update
  ↓
Zustand Store Update (if needed for cross-component state)
  ↓
Component Re-render
```

**Key Data Flow Patterns:**

1. **Calendar Events:**
   - TanStack Query caches with 30-second stale time
   - Background refetch every 2 minutes
   - Real-time updates via Supabase subscriptions (WebSocket) on family updates
   - Optimistic updates for user interactions (creating events)

2. **Conflicts:**
   - Fetched with events but stored separately
   - Subscribe to conflict updates via Supabase (real-time push)
   - Conflict resolution marked via API (removes from active list)

3. **Suggestions:**
   - Generated asynchronously by agent; polling or webhook for completion
   - Stored in suggestion feed; user can mark "seen" or "applied"
   - Feedback collected (accepted/rejected) to improve future suggestions

#### 1.3 State Management Strategy

**TanStack Query (Server State):**

- Calendar events (query key: `['calendars', familyId, timeRange]`)
- Conflicts (query key: `['conflicts', familyId]`)
- Suggestions (query key: `['suggestions', familyId]`)
- Family data (query key: `['family', familyId]`)

**Zustand Store (UI State):**

- Current filters (show/hide which family members)
- Active modal/panel state
- User preferences (notification settings, summary customization)
- Recent suggestion feedback

**Why This Split:**

- **TanStack Query**: Handles server sync, cache invalidation, and background refetch automatically
- **Zustand**: Lightweight for ephemeral UI state without server sync overhead

#### 1.4 Performance Considerations

| Metric                | Target                       | Strategy                                                                                                                         |
| --------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Calendar load         | <2 seconds (5+ calendars)    | • Query optimization + indexing<br>• Pagination (show 2 weeks, load next on scroll)<br>• Event summarization for large calendars |
| Conflict detection    | <5 minutes from event update | • Async agent invocation<br>• Database-level conflict flagging for common cases<br>• Webhook (future) replaces 5-min polling     |
| Suggestion generation | <10 seconds                  | • Agent runs with timeout<br>• Partial results if agent times out<br>• Background job if complex analysis needed                 |
| Suggestion feed load  | <1 second                    | • Store suggestions in DB, paginate<br>• Only fetch current week + next 2 suggestions                                            |
| Weekly summary        | <2 seconds                   | • Pre-computed Sunday afternoon<br>• Static template + data injection                                                            |

#### 1.5 Error Handling & Resilience

**Calendar Sync Failures:**

- Graceful degradation: show "last synced 5 minutes ago" if sync fails
- Retry with exponential backoff (30s, 2m, 5m)
- Show toast notification if sync fails 3+ times
- Manual "Sync Now" button in UI

**Missing OAuth Tokens:**

- Detect expired token on API call → show "reconnect calendar" prompt
- Don't block UI; show partial data (other calendars)

**Agent Failure:**

- If conflict detection fails: show "checking..." then "unable to process" gracefully
- If suggestion generation times out: offer manual "try again" button
- Log all failures for debugging

---

### 2. Backend Architecture

#### 2.1 Edge Functions & API Design

**Architecture Pattern:** Supabase Edge Functions (Deno-based serverless) with PostgreSQL database

```
HTTP Request (from Frontend)
  ↓
Edge Function Router
  ├─→ /api/calendars/sync         → Fetch + store calendar events
  ├─→ /api/calendars/list         → Get connected calendars
  ├─→ /api/conflicts/list         → Get family conflicts
  ├─→ /api/conflicts/resolve      → Mark conflict as resolved
  ├─→ /api/suggestions/generate   → Invoke agent for suggestions
  ├─→ /api/suggestions/feedback   → User accepts/rejects suggestion
  ├─→ /api/family/create          → Create new family
  ├─→ /api/family/members/add     → Add family member
  ├─→ /api/reminders/schedule     → Fetch upcoming reminders
  └─→ /api/reminders/acknowledge  → User acknowledged reminder
  ↓
Database Query / External API Call
  ↓
Response (JSON)
```

#### 2.2 Edge Functions Breakdown

**1. Calendar Sync Function** (`/api/calendars/sync`)

```
Purpose: Pull events from connected calendars and store in database
Trigger: Manual (user clicks "Sync") + Background (every 5 minutes)
Flow:
  1. Get family ID from auth context
  2. Fetch list of connected calendars from DB
  3. For each calendar:
     a. Fetch calendar provider's token from DB (encrypted)
     b. Call calendar provider API (Google/Apple/Outlook)
     c. MERGE with DB events (insert new, update changed, mark deleted)
  4. Trigger conflict detection (async)
  5. Return list of synced events + new conflicts
Performance: Should complete in <2 seconds for 5 calendars
```

**2. Calendar List Function** (`/api/calendars/list`)

```
Purpose: Return all connected calendars for a family
Response:
  {
    calendars: [
      { id, family_member_id, calendar_name, color, event_count, last_sync }
    ]
  }
```

**3. Conflict Detection Function** (triggered by sync or scheduled)

```
Purpose: Identify conflicts across family calendars
Trigger: After calendar sync + regular check (every 10 minutes)
Algorithm:
  1. Fetch all events for family in upcoming 90 days
  2. Group by family member + time slot
  3. Detect hard conflicts (overlapping times, same calendar impossible)
  4. Detect soft conflicts (transportation gaps, preference violations)
  5. Store new conflicts in DB, mark resolved conflicts as handled
  6. Skip conflicts user already resolved/ignored
Performance: <60 seconds for 100 events across 5 calendars
```

**4. Conflict List Function** (`/api/conflicts/list`)

```
Purpose: Return family's active conflicts
Response:
  {
    conflicts: [
      {
        id, type (hard|soft), affected_members, events, impact,
        date_created, resolution_status (unresolved|resolved|ignored)
      }
    ]
  }
```

**5. Suggestions Generation Function** (`/api/suggestions/generate`)

```
Purpose: Invoke AI agent to generate schedule optimizations
Trigger: User clicks "Get Suggestions" or automatic (weekly)
Flow:
  1. Get family ID + current conflicts + events + preferences
  2. Invoke Agent Orchestrator (see Agent Architecture)
  3. Agent uses tools to analyze schedule, generate options
  4. Store suggestions in DB with agent reasoning
  5. Return suggestions to frontend
Timeout: 10 seconds (partial results acceptable)
Error handling: If agent times out, store partial results with "incomplete" flag
```

**6. Suggestion Feedback Function** (`/api/suggestions/feedback`)

```
Purpose: Record user's response to suggestions (accepted/rejected/ignored)
Data collected:
  - suggestion_id, user_reaction (accept|reject|ignore)
  - If accepted: which events were applied
  - Timestamp
Used for: Agent learning + analytics
```

**7. Weekly Summary Function** (scheduled; triggered Sunday afternoon)

```
Purpose: Generate and store weekly summary for family
Trigger: Scheduled job (Sunday 4 PM)
Content:
  - Events for upcoming week grouped by day/person
  - Conflicts summary + proposed resolutions
  - Transportation needs
  - Family availability windows
  - Key actionable items
Storage: In DB so frontend can fetch on-demand or email can reference
```

**8. Reminders Function** (`/api/reminders/schedule`)

```
Purpose: Fetch upcoming reminders for display + sending
Returns: [ { event_id, title, time_until, reminder_type (24h|2h|day-of) } ]
Also triggers actual sending (email/push notification)
```

#### 2.3 API Contract (Frontend-Backend)

**Request Format:**

```typescript
{
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: '/api/{resource}/{action}',
  headers: {
    'Authorization': 'Bearer {jwt_token}',
    'Content-Type': 'application/json'
  },
  body?: {
    /* resource-specific data */
  }
}
```

**Response Format (Success - 200-299):**

```typescript
{
  success: true,
  data: {
    /* resource-specific data */
  },
  meta?: {
    timestamp: ISO8601,
    request_id: string
  }
}
```

**Response Format (Error - 4xx-5xx):**

```typescript
{
  success: false,
  error: {
    code: string,          // e.g., 'CALENDAR_SYNC_FAILED'
    message: string,
    details?: {}
  },
  meta?: {
    timestamp: ISO8601,
    request_id: string
  }
}
```

**Common Error Codes:**

- `AUTH_REQUIRED`: User not authenticated
- `AUTH_INVALID_TOKEN`: Token expired or invalid
- `FORBIDDEN_NOT_FAMILY_MEMBER`: User not part of family
- `CALENDAR_SYNC_FAILED`: Could not reach calendar provider
- `CALENDAR_QUOTA_EXCEEDED`: Hit calendar provider rate limit
- `AGENT_TIMEOUT`: AI agent did not complete in time
- `VALIDATION_ERROR`: Invalid request parameters

#### 2.4 Background Jobs & Scheduling

| Job                | Frequency         | Function                         | Timeout     |
| ------------------ | ----------------- | -------------------------------- | ----------- |
| Calendar Sync      | Every 5 minutes   | Fetch events from all providers  | 30 seconds  |
| Conflict Detection | Every 10 minutes  | Detect + store new conflicts     | 60 seconds  |
| Reminder Trigger   | Every minute      | Send due reminders (email/push)  | 10 seconds  |
| Weekly Summary Gen | Sunday 4 PM       | Create summary for all families  | 120 seconds |
| Token Refresh      | Daily + on-demand | Refresh calendar provider tokens | 5 seconds   |
| Suggestion Cleanup | Daily             | Archive old suggestions          | 30 seconds  |

**Implementation:** Supabase Cron Extension + Edge Functions

---

### 3. Agent Architecture

#### 3.1 Agent Design Pattern

The AI agent operates on a **tool-calling loop** pattern:

```
User Question / Scheduled Task
  ↓
Agent Receives Context:
  - Family data (members, preferences)
  - Calendar events (next 30 days)
  - Conflicts (if triggering from conflict detection)
  - Previous agent history (for continuity)
  ↓
Agent Thinks: "What tools do I need to call?"
  ↓
Agent Calls Tools (one or multiple):
  - Read family calendars
  - Check for conflicts
  - Get optimization rules
  - Generate suggestions
  ↓
Tool Results Returned to Agent
  ↓
Agent Processes Results:
  - Analyze data
  - Generate recommendations
  - Format response
  ↓
Agent Returns Answer:
  - List of suggestions with reasoning
  - Conflict analysis
  - Recommended actions
  ↓
Frontend / Backend processes response
```

#### 3.2 Agent Orchestrator (Backend Component)

The Agent Orchestrator is a Deno Edge Function that:

1. Receives a task (e.g., "generate suggestions for family 123")
2. Assembles context (family data, events, conflicts)
3. Creates system prompt with tool definitions
4. Calls LLM (OpenRouter) with tools
5. Manages tool-calling loop
6. Validates tool results
7. Returns structured response

**Pseudocode:**

```typescript
async function orchestrateAgent(task: AgentTask) {
  const context = await gatherContext(task.family_id);

  const toolDefinitions = [
    READ_CALENDAR_TOOL,
    DETECT_CONFLICT_TOOL,
    GET_FAMILY_CONTEXT_TOOL,
    OPTIMIZE_SCHEDULE_TOOL,
    GET_REMINDER_RULES_TOOL
  ];

  let response = await callLLM(
    system_prompt: AGENT_SYSTEM_PROMPT,
    context: context,
    tools: toolDefinitions,
    user_message: task.message
  );

  while (response.finish_reason === 'tool_calls') {
    const toolResults = await executTools(response.tool_calls);

    response = await callLLM(
      /* previous context + tool results */
    );
  }

  return parseResponse(response);
}
```

#### 3.3 System Prompt Design

The system prompt defines the agent's cognitive model:

```
You are a family schedule coordinator assistant. Your role is to:
1. Understand family schedules and constraints
2. Detect scheduling conflicts and problems
3. Suggest optimized schedules that resolve conflicts
4. Explain your reasoning in family-friendly language

Family Context:
- Family name: ${family.name}
- Members: ${members.map(m => m.name).join(', ')}
- Key constraints:
  - Family dinner: ${family.dinner_time}
  - Bedtime: ${family.bedtime}
  - School start: ${family.school_start_time}
  - Commute time to school: ${family.commute_duration_minutes} minutes

When you detect conflicts, use the conflict detection tool to validate.
When you suggest changes, explain why they're better and acknowledge trade-offs.
Always explain in terms of impact on family (e.g., "ensures Mom can pick up Jake")
```

---

### 4. Database Schema (Normalized Design)

#### 4.1 Core Tables

```sql
-- Authentication & Organization
users (id, email, created_at, last_login, preferences_json)
families (id, name, created_by_user_id, created_at)
family_members (id, family_id, name, role, avatar_url, created_at)

-- Calendar Integration
calendar_connections (id, family_member_id, provider, provider_account_id,
                      access_token_encrypted, refresh_token_encrypted,
                      scope, connected_at, last_sync_at, sync_status)
external_calendars (id, calendar_connection_id, provider_calendar_id,
                    calendar_name, is_primary, color, event_count)

-- Schedule Data
events (id, external_calendar_id, provider_event_id, title, description,
        start_time, end_time, is_all_day, location, recurrence_rule,
        last_synced_at, is_deleted)
event_attendees (id, event_id, family_member_id, rsvp_status)

-- Family Preferences & Rules
family_preferences (id, family_id, dinner_time, bedtime, school_start_time,
                    commute_duration_minutes, weekend_definition,
                    custom_conflict_rules_json, created_at, updated_at)
conflict_rules (id, family_id, rule_name, rule_type, condition_json,
                action_json, is_active, priority)

-- Conflict Tracking
conflicts (id, family_id, type (hard|soft), affected_member_ids,
           event_ids, description, severity (high|medium|low),
           conflict_triggered_at, resolution_status (unresolved|resolved|ignored),
           resolved_at, resolution_notes, created_at)

-- Suggestions & Agent Results
suggestions (id, family_id, suggestion_type (time_shift|reorganize|reschedule),
             description, affected_event_ids, proposed_changes_json,
             agent_reasoning, confidence_score, created_at)
suggestion_feedback (id, suggestion_id, user_reaction (accept|reject|ignore),
                     applied_changes_json, created_at)

-- Reminders & Notifications
reminders (id, event_id, reminder_time (24h|2h|1h|day_of),
           notification_type (email|push|in_app), status (pending|sent|failed),
           sent_at, created_at)
notification_log (id, reminder_id, recipient_email, sent_at, status,
                  response_code, error_message)

-- Audit & Analytics
audit_log (id, family_id, action, resource_type, resource_id,
           user_id, timestamp, details_json)
analytics_events (id, family_id, event_type, metadata_json, created_at)
```

#### 4.2 Key Design Decisions

**1. Token Encryption:**

- OAuth tokens stored encrypted in DB
- Decrypted only in memory when fetching from calendar provider
- Uses Supabase `pgcrypto` extension + server-side encryption key

**2. Event Sync & Denormalization:**

- Events stored fully in local DB (not just reference to provider)
- Avoids external API dependency for viewing schedules
- `provider_event_id` maintained for updates/deletions
- `last_synced_at` tracks freshness

**3. Conflict Storage:**

- Conflicts stored aggressively (as data arrives)
- `resolution_status` tracks user's handling
- Conflict history maintained for trend analysis

**4. Suggestion Feedback Loop:**

- Each suggestion linked to user feedback
- Enables ML/agent improvement over time
- Tracks which suggestions were actually useful

#### 4.3 Indexes for Performance

```sql
-- High-priority indexes
CREATE INDEX idx_events_external_calendar ON events(external_calendar_id);
CREATE INDEX idx_events_time_range ON events(start_time, end_time);
CREATE INDEX idx_conflicts_family ON conflicts(family_id, created_at DESC);
CREATE INDEX idx_suggestions_family ON suggestions(family_id, created_at DESC);
CREATE INDEX idx_calendar_connections_family ON calendar_connections(family_id);

-- Query optimization
CREATE INDEX idx_events_family_time ON events(family_id_via_calendar, start_time);
CREATE INDEX idx_conflicts_status ON conflicts(family_id, resolution_status);
```

---

### 5. Authentication & Security Approach

#### 5.1 Authentication Flow

**Architecture:** JWT + Supabase Auth (OAuth2 + email/password)

```
User Signup/Login
  ↓
Supabase Auth (handles email verification + OAuth)
  ↓
JWT Token issued by Supabase
  ↓
Token stored in secure HTTP-only cookie
  ↓
Token sent in Authorization header for all API requests
  ↓
Edge Function validates token + extracts user_id
  ↓
Request proceeds or returns 401/403
```

#### 5.2 Authorization Rules (Row-Level Security)

**Policy: Only family members can see family data**

```sql
CREATE POLICY family_members_can_view_events ON events
FOR SELECT USING (
  family_id IN (
    SELECT family_id FROM family_members WHERE user_id = auth.uid()
  )
);
```

**Policy: Only admin can modify family settings**

```sql
CREATE POLICY admin_only_modify_family ON family_preferences
FOR UPDATE USING (
  family_id IN (
    SELECT family_id FROM families WHERE created_by_user_id = auth.uid()
  )
);
```

#### 5.3 OAuth with Calendar Providers

**Google Calendar OAuth 2.0:**

1. User clicks "Connect Google Calendar"
2. Redirect to Google OAuth consent screen
3. User grants calendar read/write permissions
4. Google redirects back with authorization code
5. Backend exchanges code for access + refresh tokens
6. Tokens encrypted and stored in DB
7. Background job refreshes tokens before expiry

**Refresh Token Rotation:**

- Check token expiry before each API call
- Automatically refresh if within 5 minutes of expiry
- On refresh failure: alert user to reconnect

#### 5.4 Data Privacy & Encryption

**At Rest:**

- OAuth tokens: encrypted with Supabase `pgcrypto`
- User data: encrypted in transit + stored in Supabase (managed encryption)
- No PII stored unnecessarily

**In Transit:**

- All API calls over HTTPS/WSS
- JWT in Authorization header

**Audit Trail:**

- All significant actions logged (user ID, timestamp, resource, action)
- Retention: 90 days

**GDPR Compliance:**

- Users can request data export
- Users can delete family + all associated data
- Deletion cascades: family → members → calendars → events → conflicts/suggestions
- DPA in place with Supabase (hosted in US by default; EU region available)

---

## Integration Points

### 1. Frontend ↔ Backend (API Contract)

**Pattern:** RESTful JSON API

| Resource    | Method | Endpoint                          | Request                  | Response                                  | Notes                            |
| ----------- | ------ | --------------------------------- | ------------------------ | ----------------------------------------- | -------------------------------- |
| Calendars   | GET    | `/api/calendars/list`             | `family_id`              | `{ calendars: [...] }`                    | List connected calendars         |
| Calendars   | POST   | `/api/calendars/sync`             | `family_id`              | `{ events: [...], new_conflicts: [...] }` | Manual sync trigger              |
| Conflicts   | GET    | `/api/conflicts/list`             | `family_id`              | `{ conflicts: [...] }`                    | Active conflicts                 |
| Conflicts   | PUT    | `/api/conflicts/{id}/resolve`     | `{ resolution_notes }`   | `{ success: true }`                       | Mark resolved                    |
| Suggestions | POST   | `/api/suggestions/generate`       | `{ family_id, context }` | `{ suggestion_id }`                       | Async request                    |
| Suggestions | GET    | `/api/suggestions/{id}`           | -                        | `{ suggestion }`                          | Poll for result (webhook better) |
| Suggestions | POST   | `/api/suggestions/{id}/feedback`  | `{ reaction }`           | `{ success: true }`                       | User feedback                    |
| Family      | GET    | `/api/family`                     | -                        | `{ family, members, preferences }`        | Get family data                  |
| Family      | POST   | `/api/family/members`             | `{ name, role }`         | `{ member_id }`                           | Add member                       |
| Reminders   | GET    | `/api/reminders`                  | `{ time_range }`         | `{ reminders: [...] }`                    | Get upcoming                     |
| Reminders   | POST   | `/api/reminders/{id}/acknowledge` | -                        | `{ success: true }`                       | User acknowledged                |

**Authentication:** All requests require valid JWT in `Authorization: Bearer {token}` header

**Rate Limiting:**

- Standard endpoints: 100 req/minute per user
- Calendar sync: 10 req/minute per family
- Suggestion generation: 5 req/minute per family

---

### 2. Backend ↔ LLM (Tool-Calling Protocol)

**Provider:** OpenRouter (LLM aggregator)  
**Model:** Claude 3.5 Sonnet (good balance of cost/capability)  
**Protocol:** OpenAI-compatible API (chat completion with tools)

#### 2.1 Tool-Calling Request Format

```json
{
  "model": "anthropic/claude-3.5-sonnet",
  "messages": [
    {
      "role": "system",
      "content": "You are a family schedule coordinator..."
    },
    {
      "role": "user",
      "content": "Analyze our family's schedule for next week and suggest optimizations"
    }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "read_family_calendars",
        "description": "Fetch all family member calendars",
        "parameters": {
          "type": "object",
          "properties": {
            "family_id": { "type": "string" },
            "date_range_start": { "type": "string", "format": "date" },
            "date_range_end": { "type": "string", "format": "date" }
          },
          "required": ["family_id"]
        }
      }
    }
    /* ... more tools ... */
  ],
  "temperature": 0.7,
  "max_tokens": 2000
}
```

#### 2.2 Tool-Calling Response Format

```json
{
  "id": "chatcmpl-xxx",
  "choices": [
    {
      "finish_reason": "tool_calls",
      "message": {
        "role": "assistant",
        "content": null,
        "tool_calls": [
          {
            "id": "call_xxx",
            "type": "function",
            "function": {
              "name": "read_family_calendars",
              "arguments": "{\"family_id\": \"fam_123\", \"date_range_start\": \"2026-03-17\"}"
            }
          }
        ]
      }
    }
  ]
}
```

#### 2.3 Tool Result Loop (Multi-Turn)

```json
// Backend sends tool results back to agent
{
  "messages": [
    /* ... previous messages ... */
    {
      "role": "user",
      "content": "Analyze our family's schedule..."
    },
    {
      "role": "assistant",
      "content": null,
      "tool_calls": [
        /* ... tool calls ... */
      ]
    },
    {
      "role": "user",
      "content": [
        {
          "type": "tool_result",
          "tool_use_id": "call_xxx",
          "content": "{\"calendars\": [{\"member\": \"Mom\", \"events\": [...]}]}"
        }
      ]
    }
  ]
}
```

#### 2.4 Error Handling in Tool-Calling

**Timeout Handling:**

- If tool execution takes >2 seconds per tool call, timeout and return partial results
- Agent can decide to proceed with available data or report incomplete analysis

**Tool Execution Errors:**

- If tool fails (e.g., database query timeout), return error in tool result
- Agent should gracefully handle error and either retry or adjust analysis

**Invalid Tool Arguments:**

- Validate tool parameters before execution
- Return validation error in tool result with helpful message

---

### 3. LLM ↔ Tools (MCP Integration)

**Protocol:** Model Context Protocol (Anthropic's standard)  
**Purpose:** Define how tools work, what data they expect, and what they return

#### 3.1 MCP Tool Definitions

Each tool follows this structure:

```json
{
  "name": "read_family_calendars",
  "description": "Fetch all calendar events for family members in specified time range",
  "inputSchema": {
    "type": "object",
    "properties": {
      "family_id": {
        "type": "string",
        "description": "Family identifier"
      },
      "date_range_start": {
        "type": "string",
        "format": "date",
        "description": "Start date (YYYY-MM-DD)"
      },
      "date_range_end": {
        "type": "string",
        "format": "date",
        "description": "End date (YYYY-MM-DD)"
      },
      "member_ids": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Optional: specific member IDs to include"
      }
    },
    "required": ["family_id"]
  }
}
```

#### 3.2 Tool Response Format (MCP)

Tools return structured data:

```json
{
  "success": true,
  "data": {
    "calendars": [
      {
        "member_id": "member_123",
        "member_name": "Jake",
        "events": [
          {
            "id": "event_456",
            "title": "Soccer Practice",
            "start": "2026-03-17T15:30:00",
            "end": "2026-03-17T16:30:00",
            "location": "Central Park",
            "recurring": false
          }
        ]
      }
    ],
    "summary": "5 members, 23 events in March 17-24"
  }
}
```

---

### 4. Backend ↔ Calendar APIs (Sync Pattern)

#### 4.1 Calendar Provider SDKs

**Google Calendar API:**

- SDK: `google-api-php-client` / Node equivalent
- Auth: OAuth 2.0 with refresh tokens
- Pagination: `maxResults: 2500` per query
- Rate limit: 1M QPS (quota units, not requests)

**Microsoft Outlook/Office 365:**

- SDK: Microsoft Graph SDK
- Auth: OAuth 2.0 with Azure AD
- Pagination: `$top: 999`
- Rate limit: 2000 requests per 60 seconds

**Apple Calendar (iCloud):**

- Protocol: CalDAV or iCloud API
- Auth: App-specific passwords or OAuth
- Sync: Full calendar list or incremental via etags
- Rate limit: Not publicly documented; conservative 100/min

#### 4.2 Sync Algorithm (5-Minute Polling)

```typescript
async function syncCalendars(familyId: string) {
  const calendars = await getConnectedCalendars(familyId);

  for (const cal of calendars) {
    try {
      // Step 1: Check token freshness
      if (isTokenExpired(cal.access_token)) {
        cal.access_token = await refreshOAuthToken(cal);
      }

      // Step 2: Fetch events from provider
      const providerStart = cal.last_sync_at || now().minus(90, "days");
      const providerEnd = now().plus(180, "days");
      const events = await fetchCalendarEvents(cal.provider, {
        token: cal.access_token,
        start: providerStart,
        end: providerEnd,
      });

      // Step 3: Merge with local DB
      for (const event of events) {
        const existing = await getEventByProviderId(event.provider_id);
        if (existing) {
          if (event.updated_at > existing.updated_at) {
            updateEvent(existing, event); // Updated
          }
        } else {
          insertEvent(cal.id, event); // New
        }
      }

      // Step 4: Mark deleted events
      const deletedInProvider = await detectDeletedEvents(cal, events);
      for (const evt of deletedInProvider) {
        markEventDeleted(evt.id);
      }

      // Step 5: Update sync timestamp
      updateCalendarLastSync(cal.id, now());
    } catch (error) {
      logSyncError(cal.id, error);
      // Continue with next calendar; errors don't block
    }
  }

  // Step 6: Trigger conflict detection
  await detectConflicts(familyId);
}
```

#### 4.3 Token Management Strategy

| Event                    | Action                                                                 |
| ------------------------ | ---------------------------------------------------------------------- |
| Token issued             | Store with expiry; set refresh task 5 min before expiry                |
| Pre-expiry check (5 min) | Automatically refresh; no user interaction needed                      |
| Refresh fails            | Log error; next sync will detect expired token                         |
| User gets 401            | Show "reconnect calendar" prompt in UI; gracefully degrade             |
| Calendar disconnected    | Store disconnection flag; don't sync anymore; mark events for deletion |

---

## Tool Design

### 1. Calendar Reader Tool

**Purpose:** Fetch calendar events for analysis

**When Used:**

- Agent needs current family schedule
- Suggestion generation requires event context
- User manual query about schedule

**Tool Definition (MCP):**

```json
{
  "name": "read_family_calendars",
  "description": "Fetch all events from family member calendars for specified date range",
  "inputSchema": {
    "type": "object",
    "properties": {
      "family_id": {
        "type": "string",
        "description": "Family ID"
      },
      "date_range_start": {
        "type": "string",
        "format": "date",
        "description": "Start date (YYYY-MM-DD), defaults to today"
      },
      "date_range_end": {
        "type": "string",
        "format": "date",
        "description": "End date (YYYY-MM-DD), defaults to +30 days"
      },
      "include_member_ids": {
        "type": "array",
        "items": { "type": "string" },
        "description": "If specified, only include these members"
      },
      "exclude_all_day": {
        "type": "boolean",
        "description": "If true, exclude all-day events"
      }
    },
    "required": ["family_id"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "calendars": [
      {
        "member_id": "mem_123",
        "member_name": "Mom",
        "role": "Parent",
        "events": [
          {
            "id": "evt_456",
            "title": "Team Meeting",
            "start": "2026-03-17T09:00:00Z",
            "end": "2026-03-17T10:00:00Z",
            "location": "Office",
            "description": "",
            "calendar_name": "Work",
            "is_recurring": false
          }
        ]
      }
    ],
    "total_events": 47,
    "date_range": {
      "start": "2026-03-11",
      "end": "2026-04-10"
    }
  }
}
```

**Implementation Notes:**

- Query DB; no external API calls (data already synced)
- Filter by date range to reduce payload
- Exclude deleted events by default
- Returns up to 500 events (agent can paginate if needed)

---

### 2. Conflict Detection Tool

**Purpose:** Identify scheduling conflicts

**When Used:**

- After calendar sync
- Agent analyzing schedule for suggestions
- User requests conflict check

**Tool Definition (MCP):**

```json
{
  "name": "detect_conflicts",
  "description": "Identify hard conflicts (overlapping events) and soft conflicts (transportation gaps, preference violations)",
  "inputSchema": {
    "type": "object",
    "properties": {
      "family_id": {
        "type": "string",
        "description": "Family ID"
      },
      "conflict_types": {
        "type": "array",
        "enum": ["hard", "soft", "transportation", "preference"],
        "description": "Which conflict types to detect (default: all)"
      },
      "severity_threshold": {
        "type": "string",
        "enum": ["low", "medium", "high"],
        "description": "Minimum severity to include (default: low)"
      },
      "date_range_start": {
        "type": "string",
        "format": "date"
      },
      "date_range_end": {
        "type": "string",
        "format": "date"
      }
    },
    "required": ["family_id"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "conflicts": [
      {
        "id": "conf_123",
        "type": "transportation",
        "severity": "high",
        "description": "Mom's work meeting 5:00-6:00 PM overlaps with child pickup 5:30 PM",
        "affected_members": ["mem_mom", "mem_jake"],
        "affected_events": ["evt_456", "evt_789"],
        "impact": "requires solutions to pickup timing or meeting shift",
        "first_detected": "2026-03-11T14:32:00Z"
      }
    ],
    "summary": {
      "total_conflicts": 2,
      "hard": 0,
      "soft": 2,
      "by_severity": {
        "high": 1,
        "medium": 1,
        "low": 0
      }
    }
  }
}
```

**Implementation Notes:**

- Query both real-time DB state and stored conflict rules
- Algorithm:
  1. Hard conflicts: events with overlapping times, same member
  2. Transportation conflicts: events with insufficient time between locations
  3. Preference conflicts: events violating family rules
- Cache results for 10 minutes

---

### 3. Schedule Optimizer Tool

**Purpose:** Generate optimization suggestions

**When Used:**

- Agent generating suggestions in response to question
- Scheduled suggestion generation (weekly)
- User clicks "Optimize Schedule"

**Tool Definition (MCP):**

```json
{
  "name": "optimize_schedule",
  "description": "Generate suggestions to resolve conflicts and optimize family schedule",
  "inputSchema": {
    "type": "object",
    "properties": {
      "family_id": {
        "type": "string"
      },
      "constraint": {
        "type": "string",
        "description": "Specific constraint to optimize for (e.g., 'maximize family time', 'reduce transportation')"
      },
      "conflict_ids": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Specific conflicts to resolve (if empty, consider all)"
      },
      "flexibility": {
        "type": "string",
        "enum": ["low", "medium", "high"],
        "description": "How willing family is to change schedules"
      }
    },
    "required": ["family_id"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "id": "sug_123",
        "type": "time_shift",
        "priority": 1,
        "confidence": 0.92,
        "title": "Move Mom's meeting to 6:30 PM",
        "description": "Shift the Tuesday work meeting 1.5 hours later to allow time for Jake's 5:30 PM pickup",
        "affected_conflicts": ["conf_123"],
        "affected_events": ["evt_456"],
        "proposed_changes": [
          {
            "event_id": "evt_456",
            "field": "start_time",
            "old_value": "2026-03-17T17:00:00Z",
            "new_value": "2026-03-17T18:30:00Z"
          }
        ],
        "reasoning": "Mom's meeting is flexible (calendar shows 'optional' in notes). No other meetings conflict. This preserves Jake's soccer practice and ensures on-time pickup.",
        "family_impact": "Positive: Jake picked up on time. Small con: Mom's meeting overlaps dinner prep, but they have Grandma available to help.",
        "implementation_effort": "easy"
      },
      {
        "id": "sug_124",
        "type": "reorganize",
        "priority": 2,
        "confidence": 0.78,
        "title": "Have Dad do pickup instead",
        "description": "Dad's schedule Tuesday shows gap 5:00-6:30 PM. Dad could do pickup instead of Mom.",
        "affected_events": [],
        "reasoning": "Avoids changing Mom's meeting. Dad is available and can do pickup.",
        "family_impact": "Positive: Meeting stays on schedule. Dad gets time with Jake.",
        "implementation_effort": "easy"
      }
    ],
    "summary": {
      "total_suggestions": 2,
      "conflicts_addressable": 1,
      "conflicts_unresolvable": 0
    }
  }
}
```

**Implementation Notes:**

- Algorithm generates 3-5 options per conflict
- Scores by: conflict resolution, preference alignment, implementation difficulty
- Returns reasoning so user understands the why
- Can be run with timeout; returns partial results if incomplete

---

### 4. Family Context Tool

**Purpose:** Get family data for constraint application

**When Used:**

- Agent needs to understand family structure and rules
- Checking preferences when generating suggestions
- Validating suggestions against family constraints

**Tool Definition (MCP):**

```json
{
  "name": "get_family_context",
  "description": "Fetch family structure, members, preferences, and scheduling rules",
  "inputSchema": {
    "type": "object",
    "properties": {
      "family_id": {
        "type": "string"
      }
    },
    "required": ["family_id"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "family": {
      "id": "fam_123",
      "name": "Smith Family",
      "created_at": "2025-06-15T00:00:00Z",
      "member_count": 5
    },
    "members": [
      {
        "id": "mem_mom",
        "name": "Sarah Smith",
        "role": "Parent",
        "avatars": "👩‍🦰"
      },
      {
        "id": "mem_dad",
        "name": "John Smith",
        "role": "Parent",
        "avatar": "👨"
      },
      {
        "id": "mem_jake",
        "name": "Jake Smith",
        "role": "Child",
        "avatar": "👦",
        "age_group": "10-13"
      }
    ],
    "preferences": {
      "dinner_time": "18:30",
      "dinner_frequency_target": 4,
      "bedtime": "21:00",
      "school_start_time": "08:30",
      "commute_to_school_minutes": 15,
      "flexible_events": ["personal time", "side projects", "optional meetings"]
    },
    "custom_rules": [
      {
        "id": "rule_1",
        "name": "Jake homework time",
        "description": "Jake unavailable Mon/Wed/Thu 4:00-6:00 PM for homework",
        "applies_to": ["mem_jake"],
        "time_blocks": [
          { "day": "Monday", "start": "16:00", "end": "18:00" },
          { "day": "Wednesday", "start": "16:00", "end": "18:00" },
          { "day": "Thursday", "start": "16:00", "end": "18:00" }
        ]
      },
      {
        "id": "rule_2",
        "name": "Weekend family time",
        "description": "Protect Saturday 10:00 AM - 12:00 PM for family activities",
        "applies_to": ["ALL"],
        "time_blocks": [{ "day": "Saturday", "start": "10:00", "end": "12:00" }]
      }
    ]
  }
}
```

**Implementation Notes:**

- Lookup in DB; fast response
- Returns immutable snapshot (doesn't change during agent run)
- Safe to call multiple times

---

### 5. Reminder Configuration Tool

**Purpose:** Define and manage reminder rules

**When Used:**

- Agent needs to understand what reminders to send
- Agent setting up reminders for suggested changes
- Admin configuring reminder preferences

**Tool Definition (MCP):**

```json
{
  "name": "get_reminder_rules",
  "description": "Get configured reminder settings for family",
  "inputSchema": {
    "type": "object",
    "properties": {
      "family_id": {
        "type": "string"
      }
    },
    "required": ["family_id"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "default_reminders": [
      {
        "type": "24h_before",
        "channel": "email",
        "recipients": ["mem_mom", "mem_dad"],
        "enabled": true
      },
      {
        "type": "2h_before",
        "channel": "push",
        "recipients": ["ALL"],
        "enabled": true
      },
      {
        "type": "day_of",
        "channel": "email",
        "recipients": ["mem_mom"],
        "enabled": true
      }
    ],
    "event_type_overrides": [
      {
        "event_type_tag": "school",
        "reminders": [
          {
            "type": "24h_before",
            "channel": "push",
            "recipients": ["parent_primary"],
            "enabled": true
          }
        ]
      }
    ]
  }
}
```

---

## Phase Breakdown

### Phase 1: Infrastructure & Database (Week 1-2)

**Goals:**

- Production database schema in place
- Authentication working
- Backend skeleton functional

**Deliverables:**

1. Supabase project setup + Postgres DB initialized
2. Database schema migration scripts (v1)
3. Row-level security policies implemented
4. Edge Functions skeleton (routing, error handling)
5. JWT auth flow working (signup/login)
6. API response envelope standardized

**Success Criteria:**

- [ ] Can connect to Supabase DB from Edge Functions
- [ ] User registration flow completes end-to-end
- [ ] API returns formatted responses with correct status codes
- [ ] Row-level security blocks unauthorized access
- [ ] 5+ concurrent users can authenticate without errors

**Key Decisions:**

- Use Supabase (managed Postgres + Auth + Functions)
- JWT tokens in secure HTTP-only cookies
- RLS policies enforce data access

**Team:** 2-3 engineers (DB architect + backend lead + automation engineer)

---

### Phase 2: Calendar Integration (Week 3-4)

**Goals:**

- Connect to Google/Outlook/Apple calendars
- Events syncing and stored in DB
- Calendar list UI displaying connected calendars

**Deliverables:**

1. OAuth2 setup for Google, Microsoft, Apple (credentials in Supabase)
2. Calendar sync Edge Function (`/api/calendars/sync`)
3. Token encryption + refresh logic
4. Calendar list API (`/api/calendars/list`)
5. 5-minute sync scheduled job
6. Frontend calendar connection flow (OAuth redirects)
7. Frontend calendar list view

**Success Criteria:**

- [ ] User can connect Google Calendar via OAuth
- [ ] Events sync every 5 minutes
- [ ] Can handle 5+ calendars without performance issues
- [ ] Calendar disconnection cleans up events
- [ ] Token refresh prevents auth failures
- [ ] Calendar list shows sync status and last-sync timestamp

**Key Decisions:**

- Use provider SDKs for API calls (vs. building from scratch)
- Store events locally (don't hit provider API on every view)
- Sync every 5 minutes initially (webhook later for real-time)

**Team:** 2-3 engineers (OAuth specialist + backend + frontend)

**Risks & Mitigations:**

- Risk: OAuth fails; Mitigation: Thorough testing with each provider
- Risk: Rate limits exceeded; Mitigation: Conservative sync frequency
- Risk: Token crashes; Mitigation: Robust refresh + error handling

---

### Phase 3: Agent & Tool-Calling (Week 5-6)

**Goals:**

- Agent orchestrator running
- Tool-calling loop functional
- Conflict detection working

**Deliverables:**

1. Agent Orchestrator Edge Function
2. Tool execution layer (validates + runs tool code)
3. MCP tool definitions for all 5 tools
4. System prompt + agent prompting strategy
5. Conflict detection algorithm + Edge Function
6. Suggestions generation (basic version)
7. Frontend components for conflict display + suggestions

**Success Criteria:**

- [ ] Agent can read calendars via tool call
- [ ] Conflict detection identifies hard conflicts 100%
- [ ] Soft conflict detection catches transportation gaps
- [ ] Suggestions generated within 10 seconds
- [ ] Tool results returned correctly in multi-turn loop
- [ ] Agent doesn't hallucinate tool calls (validates schema)

**Key Decisions:**

- Use OpenRouter for LLM access (cost-effective)
- Claude 3.5 Sonnet (good balance of capability/cost)
- Tool definitions via MCP format

**Team:** 2-3 engineers (LLM/agent specialist + backend + frontend)

**Risks & Mitigations:**

- Risk: Agent times out; Mitigation: Set strict timeout + return partial results
- Risk: Tool calls invalid; Mitigation: Schema validation before execution
- Risk: Agent loops endlessly; Mitigation: Max iterations limit (5)

---

### Phase 4: Frontend & UI (Week 7-8)

**Goals:**

- Complete React UI for all features
- Calendar view, conflicts, suggestions, reminders

**Deliverables:**

1. Dashboard layout (week view calendar)
2. Calendar filtering (show/hide by member)
3. Event display + detail cards
4. Conflict panel + resolution UI
5. Suggestions feed + quick-apply buttons
6. Weekly summary view
7. Reminder center
8. Family settings + preferences
9. Account settings
10. Responsive design (mobile + tablet)

**Success Criteria:**

- [ ] Week view loads in <2 seconds with 5+ calendars
- [ ] Can toggle calendars on/off without lag
- [ ] Suggests are ranked by confidence + relevance
- [ ] Weekly summary prints/exports readable format
- [ ] Reminders display with clear action buttons
- [ ] Mobile view is functional (not perfect, but usable)

**Key Decisions:**

- React + TanStack for state management
- Component library (Geist UI or similar)
- TanStack Query for server state sync

**Team:** 2-3 engineers (frontend lead + UI specialist + designer)

---

### Phase 5: Refinement & Polish (Week 9-10)

**Goals:**

- Performance optimization
- Error handling + edge cases
- Analytics + monitoring

**Deliverables:**

1. Performance audit + optimization (caching, lazy loading, etc.)
2. Error boundaries + graceful failures
3. Analytics instrumentation (user events, performance)
4. Security audit + penetration testing
5. GDPR compliance review
6. Documentation (API docs, user guide, team wiki)
7. Deployment pipeline + CI/CD

**Success Criteria:**

- [ ] Calendar load <1.5 seconds consistently
- [ ] Suggestions <8 seconds (vs. 10 second target)
- [ ] <1% error rate on API calls
- [ ] 0 security vulnerabilities found in audit
- [ ] Analytics shows feature usage patterns
- [ ] Deployment automated + repeatable

**Team:** 2-3 engineers (DevOps + QA + optimization specialist)

---

## Key Milestones

| Milestone                              | Date           | Acceptance Criteria                                 | Owner         |
| -------------------------------------- | -------------- | --------------------------------------------------- | ------------- |
| **DB Schema Complete**                 | End of Week 1  | Schema reviewed + approved; RLS policies functional | Backend Lead  |
| **Auth Flow Works**                    | Mid Week 2     | User can sign up, log in, get JWT                   | Backend Lead  |
| **Google ↔ Backend Connected**         | Mid Week 3     | Events sync, stored in DB                           | Backend Lead  |
| **All 3 Providers Syncing**            | End of Week 4  | Outlook, Apple, Google all working concurrently     | Backend Lead  |
| **Agent Reads Calendars**              | Mid Week 5     | Tool call succeeds, returns events                  | LLM Engineer  |
| **Conflict Detection Works**           | Week 5         | Hard + soft conflicts detected correctly            | Backend Lead  |
| **Suggestions Generated**              | End of Week 6  | 3-5 suggestions per conflict                        | LLM Engineer  |
| **Frontend Dashboard Displays Events** | Mid Week 7     | Week view shows events colored by member            | Frontend Lead |
| **Suggestions UI Live**                | End of Week 8  | Suggestions display + user can accept/reject        | Frontend Lead |
| **Performance <2s**                    | Week 9         | Calendar load time consistently <2 seconds          | DevOps        |
| **MVP Ready for Beta**                 | End of Week 10 | All features functional, documented, tested         | Product Lead  |

---

## Known Constraints

### Technical Constraints

| Constraint                        | Impact                                                         | Workaround                                              |
| --------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------- |
| **Edge Functions cold start**     | First request after deploy ~500ms slower                       | Acceptable for MVP; use regional deployment later       |
| **WebSocket connections**         | Supabase Realtime limited to 100 concurrent; scales with price | Start with polling; upgrade as user count grows         |
| **OAuth complexity**              | Multiple provider integrations = maintenance burden            | Use well-tested SDKs; consider OAuth-as-a-service later |
| **LLM API costs**                 | Each agent run costs $0.01-0.05 at scale                       | Set budget limits; optimize prompts + tool usage        |
| **Calendar provider rate limits** | Can hit limits if many users sync simultaneously               | Implement per-user throttling + batch operations        |
| **No direct calendar write**      | MVP is read-only for calendar providers                        | Accept in MVP; add write capability in v2               |

### Business Constraints

| Constraint            | Impact                                     | Workaround                                              |
| --------------------- | ------------------------------------------ | ------------------------------------------------------- |
| **Limited marketing** | MVP uptake limited to early adopters       | Focus on word-of-mouth; showcase to developer community |
| **Support burden**    | Small team managing support + feature work | Self-serve documentation + community forum              |
| **Data residency**    | Families might want EU hosting for GDPR    | Use Supabase EU region option                           |

### Architectural Constraints

| Constraint                       | Impact                                             | Workaround                                          |
| -------------------------------- | -------------------------------------------------- | --------------------------------------------------- |
| **Polling vs. webhooks**         | 5-min sync lag; not real-time                      | Acceptable for MVP; implement webhooks v1.1         |
| **Agent determinism**            | Suggestions may vary between runs                  | Seed LLM temperature + include version in responses |
| **Tool execution in agent loop** | Agent can only call tools sequentially             | Acceptable; rarely need parallel calls              |
| **No transaction guarantee**     | If sync fails mid-way, inconsistent state possible | Implement idempotency + retry logic                 |

---

## Open Questions

### Architecture & Design

1. **Should we pre-compute conflicts or detect on-demand?**
   - Option A: Aggressive pre-compute (every sync) → more DB overhead but faster queries
   - Option B: Lazy detection (on-demand) → slower suggestions but lighter DB
   - **Recommendation:** Pre-compute hard conflicts; lazy-detect soft conflicts

2. **How do we handle recurring events efficiently?**
   - Option A: Expand all recurrences in DB (90 days) → many rows but fast queries
   - Option B: Store recurrence rule + compute on query → fewer rows but complex logic
   - **Recommendation:** Expand 90 days on sync; re-compute quarterly

3. **Should we allow users to manually adjust suggestions before committing?**
   - Option A: Auto-apply accepted suggestions → faster but less control
   - Option B: Generate draft changes, require confirmation → more control but slower
   - **Recommendation:** Draft changes shown in UI; user can tweak before applying to calendar

### User Experience

4. **How do we explain conflict resolution without jargon?**
   - Need family-friendly language + clear impact explanations
   - Suggestion: Use icons + emoji for visual clarity

5. **Should reminders be configurable per event or just globally?**
   - Option A: Global defaults only → simpler UX but less flexibility
   - Option B: Per-event customization → more powerful but UI complexity
   - **Recommendation:** Global defaults + event-level override for power users

### Integration & Scale

6. **How do we handle multiple family admins?**
   - Current design: 1 admin (creator). Should we allow adding admins?
   - Impacts: Permission model, conflict resolution strategy
   - **Decision needed before Phase 1**

7. **Should we integrate with task/habit trackers (e.g., Todoist)?**
   - Not in MVP but might be valuable future feature
   - Requires separate integration/tool
   - **Defer to v1.1**

8. **How do we monetize?**
   - Option A: Freemium (basic features free, premium for advanced suggestions)
   - Option B: Subscription from day 1
   - Option C: Open-source + consulting
   - **Recommendation:** Open-source MVP + premium tier later based on usage

### Learning & AI Agent Development

9. **How do we measure suggestion quality?**
   - Track user acceptance rate (good suggestions → accepted)
   - Track outcome (did accepted suggestion actually resolve conflict?)
   - Recommendation: Add feedback survey: "Did this help you?"

10. **Should the agent have persistent memory between conversations?**
    - Current design: Stateless (fresh context each time)
    - Alternative: Store past suggestions + user reactions; use for personalization
    - **Recommendation:** Stateless for MVP; add memory learning in v1.1

---

## Risk Register

| Risk                                   | Probability | Impact | Mitigation                                                                        |
| -------------------------------------- | ----------- | ------ | --------------------------------------------------------------------------------- |
| **Calendar provider changes API**      | Medium      | High   | Monitor provider announcements; abstract provider logic; use well-maintained SDKs |
| **Users don't connect all calendars**  | High        | Medium | Educate on import; show value of multi-calendar view early                        |
| **Suggestions not helpful**            | Medium      | High   | User testing + feedback loop; iterate on prompt; track acceptance rate            |
| **Performance degrades with scale**    | Medium      | High   | Load testing; database optimization; implement caching + pagination               |
| **Token refresh fails silently**       | Low         | High   | Comprehensive logging + alerting; manual reconnect UX                             |
| **Agent generates bad suggestions**    | Low         | Medium | Output validation; human review; set confidence thresholds                        |
| **Users forget to onboard all family** | High        | Low    | Onboarding checklist; progress indicator                                          |
| **GDPR compliance incomplete**         | Low         | High   | Legal review; implement data deletion; audit logs                                 |

---

## Success Metrics & Monitoring

### User Success Metrics

- **Adoption:** >80% of families connect 2+ calendars within first week
- **Engagement:** >70% active weekly (2+ visits/week)
- **Satisfaction:** >4.0/5.0 rating on feature usefulness
- **Conflict Resolution:** Users resolve >60% of detected conflicts

### Technical Metrics

- **Availability:** > 99.5% uptime
- **Performance:**
  - Calendar load: <2 seconds (p95)
  - Suggestion generation: <10 seconds (p95)
  - API response: <500ms (p95)
- **Error Rate:** <1% (5xx errors / total requests)
- **Cost:** <$50/month for 100 active families

### Agent Metrics

- **Suggestion Quality:** >70% acceptance rate by users
- **Accuracy:** Detects >99% of hard conflicts
- **Speed:** 95% of suggestions generated in <10 seconds

---

## Next Steps

1. **Week 0 (Alignment):**
   - Stakeholder review of this plan
   - Resolve open questions
   - Finalize team assignments

2. **Week 1 (Kickoff):**
   - Database schema finalized + approved
   - Backend team starts implementation
   - Frontend team designs UI mockups

3. **Ongoing:**
   - Weekly progress synchronization
   - Risk monitoring
   - Scope management (avoid feature creep)

---

**Document Version:** 1.0  
**Last Updated:** March 11, 2026  
**Next Review:** April 1, 2026  
**Author:** AI Architecture Planning Team
