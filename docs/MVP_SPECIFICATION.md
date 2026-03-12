# Family AI Scheduler – MVP Feature Specification

**Version:** 1.0  
**Date:** March 11, 2026  
**Status:** Ready for Implementation Planning

---

## 1. Executive Summary

The Family AI Scheduler MVP is an AI-powered coordination tool that aggregates multiple family calendars, detects scheduling conflicts, and provides AI-generated optimization suggestions. The MVP focuses on reducing the mental load of family schedule management through intelligent conflict detection, automated weekly planning assistance, and proactive reminders.

**Target Users:** Busy parents managing 2+ family members' schedules  
**Deployment:** Web application (React)  
**Integration:** Multi-calendar sources (Google, Apple, Outlook)

---

## 2. Feature Objectives & Success Criteria

### 2.1 Primary Objectives

| Objective                             | Description                                                               | Success Metric                                                  |
| ------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Reduce Schedule Coordination Time** | Enable families to coordinate schedules 60% faster than manual methods    | Parents spend <10 minutes/week on schedule review               |
| **Eliminate Invisible Conflicts**     | Detect 100% of overlapping family events across all connected calendars   | System identifies all conflicts before they cause issues        |
| **Automate Weekly Planning**          | Generate actionable weekly summaries and optimization suggestions         | Users report 90%+ relevance of AI suggestions                   |
| **Increase Engagement**               | Maintain weekly active usage through smart reminders and proactive alerts | >70% of families interact with system 2+ times/week             |
| **Improve Family Organization**       | Provide single source of truth for family schedules                       | Users trust system as primary scheduling tool for family events |

### 2.2 Success Criteria (Technology-Agnostic)

1. **Conflict Detection Accuracy:** System identifies all scheduling conflicts within 5 minutes of calendar updates
2. **Weekly Planning Support:** Users receive week-ahead summary by Sunday 6 PM with 3+ optimization suggestions
3. **Notification Reliability:** Smart reminders reach users at appropriate times (24hrs, 2hrs, and day-of) with 98% delivery success
4. **Family Coordination:** System enables typical family (2 adults, 2-3 children) to coordinate 100+ events/month with <15 minutes/week admin time
5. **User Satisfaction:** MVP achieves >4.0/5.0 rating on ease of use within first month of deployment
6. **Data Completeness:** 95%+ of connected calendar events successfully imported and visible
7. **Performance:** Calendar views load within 2 seconds; AI suggestions generated within 10 seconds of request
8. **Adoption:** 80%+ of onboarded families connect 2+ calendars within first week

---

## 3. MVP Feature Set

### 3.1 Multi-Calendar Integration

**Objective:** Centralize all family member calendars into a unified view

**Functional Requirements:**

1. Support OAuth2 connections to Google Calendar, Apple Calendar (iCloud), and Microsoft Outlook
2. Import up to 10 calendars per family account
3. Sync calendar events every 5 minutes (or within 5 minutes of event changes)
4. Display calendar color coding by source and family member
5. Import historical events up to 90 days in the past
6. Handle calendar deletion/disconnection without data loss
7. Support read-only calendar access (no write-back to source calendars in MVP)

**Acceptance Criteria:**

- [ ] User can connect Google Calendar via OAuth and grant permissions
- [ ] User can connect Apple Calendar via iCloud credentials
- [ ] User can connect Outlook calendar via Microsoft account
- [ ] Events from all connected calendars appear in unified week view within 30 seconds
- [ ] Color-coded events show which family member owns each event
- [ ] Disconnecting a calendar removes its events from view
- [ ] Events appear in real-time when added to source calendar (within 5 minutes)
- [ ] User can connect 10 calendars without performance degradation

**Acceptance Scenarios:**

- **Scenario 1:** Parent connects mom, dad, and three kids' Google Calendars → All 5 calendars display in unified week view with distinct colors
- **Scenario 2:** Event added to child's school calendar → Event appears in app within 5 minutes
- **Scenario 3:** Parent disconnects child's calendar → All events from that calendar disappear immediately

---

### 3.2 Family Profiles & Calendar Ownership

**Objective:** Create organized family structure with clear calendar ownership and member attributes

**Functional Requirements:**

1. Create family account with 1 family admin (typically parent)
2. Add family members (2-10 people) with name and avatar
3. Assign calendars to specific family members
4. Tag family members with roles (Parent, Child, Caregiver)
5. Store family preferences (dinner time, bedtime, commute time to school)
6. Support family members without their own calendar
7. Display family hierarchy in settings

**Acceptance Criteria:**

- [ ] Admin creates family with custom name
- [ ] Admin can add up to 10 family members with names and avatars
- [ ] Each family member displays with assigned role
- [ ] Calendars clearly show which family member owns them
- [ ] Family preferences saved and used for optimization suggestions
- [ ] Non-calendar members appear in family roster
- [ ] Family settings accessible from main menu

**Acceptance Scenarios:**

- **Scenario 1:** Admin creates family "Smith Family" and adds: Mom (email), Dad (email), Jake (school calendar), Maya (school calendar), Grandma (phone only)
- **Scenario 2:** Admin updates family dinner time to 6:30 PM → System uses this for conflict detection
- **Scenario 3:** Admin adds new child → New child calendar available for connection immediately

---

### 3.3 AI Conflict Detection

**Objective:** Automatically identify and surface scheduling conflicts across family calendars

**Functional Requirements:**

1. Detect hard conflicts (overlapping events) across all family members
2. Detect soft conflicts (transportation constraints, insufficient break time)
3. Identify conflicts between work events and family commitments
4. Flag conflicts with decision markers (parent/child, controllable/fixed)
5. Generate conflict summary with impact assessment
6. Surface conflicts within 5 minutes of calendar update
7. Display conflict history for trend analysis
8. Support custom conflict rules (e.g., no soccer practice Tuesday-Thursday)

**Acceptance Criteria:**

- [ ] Hard conflict detected when two events overlap in same calendar or across family members
- [ ] Soft conflict detected when Mom's work ends at 5:45 PM and child's pickup is at 5:30 PM
- [ ] Conflict marked as "transportation issue" vs. "scheduling overlap" appropriately
- [ ] Parent receives alert when conflict detected
- [ ] Conflict details show which family members are affected
- [ ] Conflicts persist in history until marked resolved
- [ ] Custom rules (e.g., Jake unavailable Thu 4-6 PM for homework) applied to conflict detection

**Acceptance Scenarios:**

- **Scenario 1:** Mom's work meeting 5:00-6:00 PM + child soccer pickup 5:30 PM → Flagged as transportation conflict
- **Scenario 2:** Two children's events at same time (controllable) → Flagged as scheduling overlap
- **Scenario 3:** After custom rule set (Jake no soccer Tuesdays), Thursday soccer doesn't conflict but Tuesday does → System applies rule

---

### 3.4 Weekly Schedule Summary

**Objective:** Provide weekly overview of family schedule with key events and potential issues

**Functional Requirements:**

1. Auto-generate weekly summary by Sunday 6 PM
2. Highlight all events for upcoming week organized by day and family member
3. Include conflict summary with count and severity
4. Show family availability windows (when all/most available)
5. Summarize transportation needs and logistics
6. Surface actionable items (RSVPs needed, confirmations needed)
7. Support customization of summary (include/exclude event types, family members)
8. Provide downloadable/printable summary format

**Acceptance Criteria:**

- [ ] Weekly summary generates automatically Sunday evening
- [ ] Summary shows all 7 days with events grouped by day
- [ ] Conflicts prominently displayed with resolution suggestions
- [ ] Transportation needs summarized (who needs pickup/dropoff when)
- [ ] User can mark summary items as acknowledged
- [ ] Summary email contains key information without overwhelming detail
- [ ] User can customize which event types appear in summary
- [ ] Summary printable in family-friendly format

**Acceptance Scenarios:**

- **Scenario 1:** User opens Sunday summary → Sees week overview: 8 family events, 2 conflicts, transportation needs for 3 pickups
- **Scenario 2:** Weekly email contains summary link and key alert (Jake's soccer Thursday has transportation conflict)
- **Scenario 3:** User customizes summary to exclude personal work events → Summary shows only family events

---

### 3.5 AI-Generated Schedule Optimization Suggestions

**Objective:** Provide intelligent recommendations to resolve conflicts and optimize family schedule

**Functional Requirements:**

1. Analyze conflicts and suggest resolution options
2. Propose time shifts for flexible events to eliminate conflicts
3. Suggest activity scheduling alternatives (different time, different family member)
4. Group related events for efficiency (all shopping appointments same day)
5. Recommend family time windows (based on availability and preferences)
6. Generate natural language explanations for suggestions
7. Allow user acceptance/rejection with one-click implementation
8. Learn from user preferences (remember what types of changes they like)

**Acceptance Criteria:**

- [ ] For each conflict, generate 2-3 resolution options
- [ ] Options include at least one time-shift proposal
- [ ] Options consider family preferences (dinner time, bedtime, commute constraints)
- [ ] Suggestions include natural language explanation
- [ ] User can accept suggestion → Auto-generates draft event changes (no auto-commit to calendar)
- [ ] User can view all recent suggestions in history
- [ ] Suggestions improve in relevance after 5+ user interactions
- [ ] Bulk suggestions can be reviewed and applied together

**Acceptance Scenarios:**

- **Scenario 1:** Mom 5:00-6:00 PM + child pickup 5:30 PM conflict → Suggestions: (A) Move child pickup to 4:00 PM, (B) Reschedule Mom's meeting to 6:30 PM, (C) Have Dad do pickup instead
- **Scenario 2:** Jake and Maya both have Thursday soccer → Suggestion: Try Wednesday 4:00 PM for Maya (no conflict, Mom available)
- **Scenario 3:** User consistently reschedules doctor appointments to late afternoon → System learns this preference and suggests late afternoon times for future medical events

---

### 3.6 Smart Reminders & Notifications

**Objective:** Proactively alert family members to upcoming events and important schedule information

**Functional Requirements:**

1. Send reminders 24 hours before major events (school, medical, sports)
2. Send reminders 2 hours before time-sensitive events (pickups, meetings)
3. Send day-of reminder 1 hour before
4. Notify about detected conflicts within 5 minutes
5. Daily digest of that day's events (morning notification)
6. Transportation alerts (if pickup/dropoff needed)
7. Customizable reminder preferences per family member
8. Support multiple notification channels (in-app, email, SMS for urgent)
9. Allow snooze/dismiss functionality
10. Track notification delivery and user engagement

**Acceptance Criteria:**

- [ ] Notification sent 24 hours before school event
- [ ] Notification sent 2 hours before child pickup
- [ ] Conflict alert sent within 5 minutes of detection
- [ ] Morning digest sent at user-customized time
- [ ] User can disable notifications for specific event types
- [ ] User can mute notifications for specific family member's events
- [ ] Notifications include relevant details (time, location, who's involved)
- [ ] Snoozed notifications reappear at appropriate time
- [ ] 98% of notifications delivered successfully
- [ ] SMS used only for high-priority alerts

**Acceptance Scenarios:**

- **Scenario 1:** At 8:00 AM, parent receives morning digest listing today's 5 events including 2:30 PM soccer pickup
- **Scenario 2:** Conflict detected at 3:45 PM (Mom stuck in meeting, needs to pick up child at 4:00 PM) → Urgent notification sent immediately
- **Scenario 3:** User disables sports event reminders → No reminders for Jake's soccer but still gets school/medical event reminders

---

## 4. User Journeys

### Journey 1: Initial Setup & Family Calendar Connection

**User:** Sarah (busy mother with 2 kids)  
**Goal:** Get family calendar visible in one place

| Step           | Action                                                | System Response                                               | Duration   |
| -------------- | ----------------------------------------------------- | ------------------------------------------------------------- | ---------- |
| 1              | Sarah signs up with email                             | Account created, onboarding starts                            | 2 min      |
| 2              | Create "Smith Family" profile                         | Family created, shown member list                             | 1 min      |
| 3              | Add Mom (Sarah), Dad, Jake (10yo), Emma (8yo)         | Family roster created                                         | 2 min      |
| 4              | Connect Google Calendar for Mom                       | OAuth flow, permissions granted                               | 1 min      |
| 5              | Connect Google Calendar for Dad                       | Dad's calendar imported                                       | 1 min      |
| 6              | Connect Emma's school calendar (shared in Google)     | School events imported                                        | 1 min      |
| 7              | Connect Jake's school calendar                        | Jake's school events imported                                 | 1 min      |
| 8              | View unified week view                                | 5 calendars displayed in color-coded view, ~30 events visible | 1 min      |
| 9              | Set family preferences (dinner 6 PM, bedtime 8:30 PM) | Preferences saved for conflict detection                      | 2 min      |
| **Total Time** |                                                       |                                                               | **11 min** |

**Success Outcome:** Sarah can see all 4 family members' schedules in one view and starts receiving conflict alerts

---

### Journey 2: Conflict Detection & Resolution

**User:** Sarah (continuing from Journey 1)  
**Goal:** Detect and resolve a scheduling conflict

| Step           | Action                                                                                | System Response                                                                                             | Duration   |
| -------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------- |
| 1              | Tuesday morning: Emma's school calls—dentist appointment conflicts with Jake's soccer | Sarah already sees conflict highlighted in red                                                              | –          |
| 2              | Sarah opens conflict details                                                          | Sees: "March 18, 4:00-4:30 PM - both need transportation simultaneously"                                    | 1 min      |
| 3              | Views AI suggestions                                                                  | 3 options: (A) Reschedule dentist to 3:00 PM, (B) Move soccer to 5:00 PM, (C) Have Dad handle soccer pickup | 30 sec     |
| 4              | Selects Option A—reschedule dentist to 3:00 PM                                        | App shows draft event change waiting approval                                                               | 1 min      |
| 5              | Confirms change                                                                       | Sarah's calendar updated; original dentist appointment moved in Google Calendar                             | 30 sec     |
| 6              | Conflict clears from list                                                             | System shows zero conflicts for Tuesday now                                                                 | 10 sec     |
| **Total Time** |                                                                                       |                                                                                                             | **~3 min** |

**Success Outcome:** Conflict resolved without phone calls or manual calendar juggling; trust in system increases

---

### Journey 3: Weekly Planning Review

**User:** Sarah (Sunday evening)  
**Goal:** Review upcoming week and address potential issues

| Step           | Action                                                                                      | System Response                                                     | Duration   |
| -------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------- |
| 1              | Sarah receives email: "Your Family Schedule Summary is Ready"                               | Email at 6 PM Sunday with link and key alerts                       | –          |
| 2              | Opens app/email link to weekly summary                                                      | Sees: 8 family events, 1 potential conflict, 4 transportation needs | 2 min      |
| 3              | Views conflict: Mon 3-4 PM is "tight" (Emma tutoring ends 3 PM, Jake soccer starts 3:30 PM) | Suggestion shown: Have Dad pick up Emma, Mom take Jake              | 1 min      |
| 4              | Approves suggestion                                                                         | System drafts event assignments                                     | 30 sec     |
| 5              | Reviews transportation logistics                                                            | Summary shows: 2 afternoon pickups, 1 evening event                 | 1 min      |
| 6              | Checks for family time windows                                                              | System shows Wed + Fri evenings everyone available 6-8 PM           | 1 min      |
| 7              | Dismisses summary (ready for the week)                                                      | Summary marked completed                                            | 10 sec     |
| **Total Time** |                                                                                             |                                                                     | **~6 min** |

**Success Outcome:** Week planned, all conflicts identified and resolved before they cause problems

---

### Journey 4: Daily Event Engagement & Reminders

**User:** Sarah & family members (throughout week)  
**Goal:** Stay on top of daily events through reminders

| Step            | Action                                   | System Response                                                            | Duration                        |
| --------------- | ---------------------------------------- | -------------------------------------------------------------------------- | ------------------------------- |
| 1 (Wed 7:30 AM) | Sarah receives morning digest            | "3 events today: Emma's tutoring 3 PM, both kids soccer 4 PM, dinner 6 PM" | –                               |
| 2 (Wed 1:55 PM) | Sarah receives transportation prep alert | "Emma tutoring in ~1 hour. Leave by 2:40 PM to arrive on time"             | –                               |
| 3 (Wed 2:00 PM) | Sarah snoozes reminder                   | Alert reappears at 2:20 PM                                                 | 10 sec                          |
| 4 (Wed 3:00 PM) | Emma event reminder (via email/app)      | "Tutoring reminder - starts in 1 hour"                                     | –                               |
| 5 (Wed 5:45 PM) | Sarah receives after-event check-in      | (Optional) "Did Emma make it to tutoring OK? Mark complete"                | –                               |
| 6 (Wed 6:00 PM) | Remaining reminders for day              | Family dinner reminder (customized to each family member's phone)          | –                               |
| **Total Time**  |                                          |                                                                            | **Asynchronous throughout day** |

**Success Outcome:** No one forgets an event; transportation logistics handled smoothly; family stays informed

---

## 5. Acceptance Criteria by Feature

### 5.1 Multi-Calendar Integration

| Criterion             | Acceptance Criteria                                                            | Test Method                                              |
| --------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------- |
| **OAuth Integration** | User redirected to Google/Apple/Outlook login; permissions requested clearly   | Manual testing: connect each provider                    |
| **Calendar Sync**     | Events appear within 5 minutes of being added to source calendar               | Automated: add event to source, verify sync time         |
| **Color Coding**      | Each connected calendar displays unique color; family member association clear | Visual inspection: week view shows colors                |
| **Historical Import** | Past 90 days of events imported on connection                                  | Verify: count of past events matches source              |
| **Disconnection**     | Removing calendar removes all its events from app within 10 seconds            | Manual test: disconnect calendar, verify removal         |
| **Scaling**           | 10 calendars with 100+ total events display without UI lag                     | Performance test: load time <2 seconds with 1000+ events |

### 5.2 Family Profiles & Calendar Ownership

| Criterion               | Acceptance Criteria                                           | Test Method                          |
| ----------------------- | ------------------------------------------------------------- | ------------------------------------ |
| **Family Creation**     | Admin can create family with custom name                      | Manual testing                       |
| **Member Management**   | Can add/edit/remove up to 10 family members                   | Manual testing                       |
| **Role Assignment**     | Roles (Parent, Child, Caregiver) assigned and displayed       | Verify display in family roster      |
| **Preferences Storage** | Family preferences (dinner time, bedtime) saved and persisted | Verify in database after save        |
| **Calendar Assignment** | Clear association between family members and their calendars  | Visual verification in calendar view |

### 5.3 AI Conflict Detection

| Criterion             | Acceptance Criteria                                                               | Test Method                             |
| --------------------- | --------------------------------------------------------------------------------- | --------------------------------------- |
| **Hard Conflicts**    | Overlapping events flagged within 5 minutes                                       | Create overlapping events, verify alert |
| **Soft Conflicts**    | Transportation issues detected (e.g., 30-min pickup travel time)                  | Test with realistic scenarios           |
| **Conflict Metadata** | Each conflict includes: type, severity, involved members, suggested resolutions   | Inspect conflict details                |
| **History Tracking**  | Conflicts persist in history; can be marked resolved                              | Verify conflict log                     |
| **Custom Rules**      | User-defined rules (e.g., "Jake unavailable Tue-Thu 4-6 PM") applied to detection | Create rule, test detection             |

### 5.4 Weekly Schedule Summary

| Criterion                | Acceptance Criteria                                                    | Test Method                                  |
| ------------------------ | ---------------------------------------------------------------------- | -------------------------------------------- |
| **Auto-Generation**      | Summary generates every Sunday 6 PM automatically                      | Verify timing over multiple weeks            |
| **Content Completeness** | Includes all events, conflicts, transportation needs, actionable items | Inspect summary content                      |
| **Email Delivery**       | Summary email delivered to family admin with link to view in-app       | Verify email delivery and link functionality |
| **Customization**        | User can include/exclude event types (work, personal, school, etc.)    | Test preference toggles                      |
| **Printable Format**     | Summary can be printed with family-friendly layout                     | Manual printing test                         |

### 5.5 AI-Generated Suggestions

| Criterion                | Acceptance Criteria                                                     | Test Method                            |
| ------------------------ | ----------------------------------------------------------------------- | -------------------------------------- |
| **Multiple Options**     | For each conflict, 2-3 resolution options presented                     | Inspect suggestions for variety        |
| **Natural Language**     | Explanations clear and compelling (not robotic)                         | User feedback / readability evaluation |
| **One-Click Acceptance** | User can accept suggestion and generate draft changes with single click | Manual testing                         |
| **Preference Learning**  | After 5+ interactions, system suggests similar solutions                | Monitor suggestion patterns over time  |
| **Bulk Processing**      | User can review and apply multiple suggestions together                 | Test batch suggestion review           |

### 5.6 Smart Reminders & Notifications

| Criterion             | Acceptance Criteria                                              | Test Method                            |
| --------------------- | ---------------------------------------------------------------- | -------------------------------------- |
| **Timing Accuracy**   | Reminders sent at: 24h, 2h, 1h before events (configurable)      | Automated tests with time simulation   |
| **Delivery Rate**     | 98%+ of notifications delivered successfully                     | Monitor delivery logs                  |
| **Customization**     | User can disable notifications by event type or family member    | Test preference toggles                |
| **Snoozable**         | User can snooze reminder; reappears at user-configured time      | Manual testing                         |
| **Conflict Alerts**   | Urgent alerts for newly detected conflicts sent within 5 minutes | Test with synthetic conflict scenarios |
| **Channel Selection** | Notifications via in-app + email; SMS for urgent only            | Verify channels activated              |

---

## 6. Dependencies & Assumptions

### 6.1 External Dependencies

| Dependency                   | Impact                                           | Mitigation                                                                |
| ---------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| **Google Calendar API**      | Required for 80%+ of integrations                | Fallback to manual sync; graceful API error handling                      |
| **Apple iCloud API**         | Required for Apple calendar support              | Documentation; support for shared Google calendars if direct iCloud fails |
| **OpenRouter LLM Service**   | Required for AI suggestions & summary generation | Fallback to simpler conflict detection if LLM unavailable                 |
| **Supabase Database & Auth** | Core backend infrastructure                      | Database backup strategy; authentication failover                         |
| **Email Service**            | Required for weekly summary & reminder emails    | Queue-based email delivery; retry logic for failed sends                  |

### 6.2 Key Assumptions

| Assumption                                                                                                   | Rationale                                                                                           | Impact if Wrong                                                              |
| ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Calendar API Rate Limits:** Google Calendar API allows 1M requests/day                                     | Typical family: ~200 req/day; 5000 users = 1M req/day capacity                                      | May need higher-tier API access or caching strategy                          |
| **Event Data Availability:** Calendar events include start time, end time, title, potentially attendance     | Basic scheduling requires these fields; richer features depend on location, attendees, descriptions | Reduce feature scope or request calendar sharing permissions                 |
| **User Prefers Centralized View:** Users value seeing all calendars in one place over native app integration | Simpler MVP scope; web-first approach aligns with this                                              | May need native app builds; adjust prioritization                            |
| **Weekly Sunday Summary Cadence:** Most families plan for the week starting Monday                           | Weekly rhythm matches family planning cycle                                                         | More frequent summaries (daily) or different cadence if data shows otherwise |
| **Family Sizes 2-10 members:** MVP optimized for typical families                                            | If larger families common (boarding schools, multi-generational), scale UI/performance              | Adjust for observed user base                                                |
| **English-language MVP:** Initial launch English only                                                        | Simplifies AI prompt engineering and support                                                        | Localization needed for international expansion                              |

---

## 7. Out of Scope for MVP

### Explicitly Excluded Features

| Feature                        | Reason                                                                       | Future Consideration                                     |
| ------------------------------ | ---------------------------------------------------------------------------- | -------------------------------------------------------- |
| **Calendar Event Creation**    | Use cases met by native calendar apps; MVP reads only                        | Phase 2: Allow event creation with AI scheduling         |
| **Multi-family Accounts**      | Scope complexity; MVP targets single family per account                      | Phase 2: Enable family sharing across accounts           |
| **Mobile App (Native)**        | Web MVP sufficient for desktop + mobile browser access                       | Phase 2: Consider iOS/Android native apps if high demand |
| **Real-time Collaboration**    | No simultaneous multi-user editing; import/export sufficient                 | Phase 2: Real-time sync for household decisions          |
| **Advanced Reporting**         | MVP provides weekly summary only; no analytics dashboards                    | Phase 3: Historical trends, optimization metrics         |
| **Integration Write-Back**     | No modification of source calendars; draft-only changes in MVP               | Phase 2: Confirm changes and sync back to Google/Apple   |
| **Custom Reminders per Event** | Standard 24/2/1 hour reminders only; no per-event customization              | Phase 2: User can override reminder timing per event     |
| **Multi-Language Support**     | English only; AI prompts in English                                          | Phase 2+: Localization for target markets                |
| **HIPAA/Compliance**           | No healthcare-specific data handling (though medical appointments supported) | Phase 2: Compliance if health data storage needed        |
| **Family Invoicing/Billing**   | No split payments or family budget integration                               | Beyond scope: Different product focus                    |

### Optional Features (Implementation Discretion)

- User-defined color schemes for calendar events
- Dark mode UI
- Family event discussion threads (comments on events)
- Recurring event conflict handling (special case for weekly sports practices)
- Calendar sharing with extended family (grandparents, etc.)
- Integration with third-party apps (Slack, iCal export)

---

## 8. Technical Constraints & Considerations

### 8.1 Frontend Constraints

| Constraint                   | Impact                                                    | Handling                                                   |
| ---------------------------- | --------------------------------------------------------- | ---------------------------------------------------------- |
| **React Version**            | Latest stable (v19+) for hooks, concurrent rendering      | Browser support: Chrome, Safari, Firefox (last 2 versions) |
| **TanStack Data Management** | TanStack Query for server state; Zustand for client state | Requires careful cache invalidation on calendar sync       |
| **Browser Storage Limits**   | Local storage ~5-10MB; session storage temporary          | Rely on server-side state; minimal local caching           |
| **Responsive Design**        | Mobile, tablet, desktop support                           | Desktop-first in MVP; mobile-responsive layouts primary    |

### 8.2 Backend Constraints

| Constraint                            | Impact                                                              | Handling                                                                    |
| ------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Supabase Row-Level Security (RLS)** | Family data must isolate by family ID; no cross-family data leakage | RLS policies enforced at database level; no bypassing in application code   |
| **Real-time Sync Frequency**          | Can't sync from all calendar APIs every 1 minute                    | 5-minute sync interval acceptable; user can manually trigger on-demand sync |
| **Supabase Function Execution Time**  | Edge functions timeout ~15 seconds                                  | Complex AI operations handled asynchronously; results stored in database    |
| **Concurrent Users**                  | Busy families: 2-3 concurrent users per family account              | Rate limiting: 100 req/min per family; queue heavy operations               |

### 8.3 AI & LLM Constraints

| Constraint               | Impact                                                                   | Handling                                                                            |
| ------------------------ | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| **LLM Response Latency** | OpenRouter requests may take 2-5 seconds                                 | Suggestions generated asynchronously; user doesn't wait for AI                      |
| **LLM Token Limits**     | Context limited to 2000 tokens for cost; full week schedule might exceed | Summarize calendar context before sending to LLM                                    |
| **Hallucination Risk**   | LLM may generate unrealistic suggestions                                 | Validate suggestions: check constraints, rules, family preferences before surfacing |
| **Cost Per Request**     | LLM calls cost ~$0.0001-0.001 per suggestion                             | 100 families \* 5 suggestions/week ≈ $0.05/week; acceptable cost at this scale      |

### 8.4 Calendar Integration Constraints

| Constraint                      | Impact                                                                     | Handling                                                                             |
| ------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **OAuth Permissions**           | Google Calendar requires "calendar.readonly" scope; limited to read access | Document scope clearly; inform users no write-back in MVP                            |
| **Rate Limits**                 | Google Calendar API: 1M requests/day; 100 requests/second burst            | Batch requests; cache calendar data; implement backoff; monitor usage                |
| **Event Metadata Availability** | Not all calendar events include location, attendees, or descriptions       | Design conflict detection based on core fields only; optional fields enhance results |
| **Timezone Handling**           | Family members may be in different timezones                               | Store events in UTC; display in user's local timezone; handle DST transitions        |

### 8.5 Data Privacy & Security

| Consideration                | Requirement                                                | Implementation                                                  |
| ---------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------- |
| **Calendar Data Encryption** | All calendar data encrypted in transit (HTTPS) and at rest | TLS 1.3 for transport; database encryption for stored data      |
| **Auth Token Security**      | OAuth tokens stored securely (not in localStorage)         | Use secure HTTP-only cookies; refresh token rotation            |
| **Family Data Isolation**    | Users can only access their family's data                  | RLS policies; JWT subject claim includes family_id              |
| **Audit Logging**            | Track access to family calendar data                       | Log all API calls with user, timestamp, action; monthly reviews |

---

## 9. Implementation Roadmap (Sequencing)

### Phase 1: Foundation (Weeks 1-3)

1. Setup Supabase schema (families, members, calendars, events)
2. Implement Google Calendar OAuth integration
3. Basic calendar event import & unified week view
4. Family profile creation & calendar assignment

### Phase 2: Conflict Intelligence (Weeks 4-6)

1. Hard conflict detection logic
2. Soft conflict detection (transportation constraints)
3. Conflict alert notifications
4. Conflict display & history

### Phase 3: AI & Planning (Weeks 7-9)

1. OpenRouter LLM integration for suggestions
2. AI suggestion generation & refinement
3. Weekly summary generation & email delivery
4. Suggestion acceptance & draft calendar updates

### Phase 4: User Experience (Weeks 10-12)

1. Smart reminders (24h, 2h, 1h before events)
2. Notification customization & preferences
3. Mobile-responsive design refinement
4. Performance optimization

### Phase 5: Additional Integrations & Polish (Weeks 13-15)

1. Apple Calendar integration
2. Outlook integration
3. Testing & bug fixes
4. Edge case handling
5. MVP launch preparation

---

## 10. Success Metrics & Launch Readiness

### Launch Definition

MVP is ready to launch when:

1. ✅ **Functionality Complete:** All 6 core features implemented and tested
2. ✅ **Conflict Detection:** Detects 100% of hard conflicts; >90% of soft conflicts
3. ✅ **AI Suggestions:** >70% of users rate suggestions as "useful" or better
4. ✅ **Notifications:** 98%+ delivery success rate; zero critical notification bugs
5. ✅ **Performance:** App loads in <2 seconds; AI suggestions within 10 seconds
6. ✅ **Security:** RLS policies enforced; zero data leakage in security testing
7. ✅ **Documentation:** User guide, support docs, API documentation complete
8. ✅ **Support:** Staffing ready; support email monitored; FAQ prepared

### Post-Launch Monitoring

| Metric                            | Target                            | Monitoring Cadence    |
| --------------------------------- | --------------------------------- | --------------------- |
| **Daily Active Families**         | >500 within Month 1               | Real-time dashboard   |
| **Conflict Detection Accuracy**   | >95% detection rate               | Weekly audit          |
| **AI Suggestion Acceptance Rate** | >60% accept or modify suggestions | Weekly query          |
| **Feature Engagement**            | >70% use 2+ core features weekly  | Weekly analytics      |
| **User Satisfaction**             | >4.0/5.0 rating                   | Monthly surveys       |
| **System Availability**           | >99.5% uptime                     | Continuous monitoring |

---

## 11. Risks & Mitigation

| Risk                           | Severity | Mitigation                                                                                |
| ------------------------------ | -------- | ----------------------------------------------------------------------------------------- |
| **Calendar API Rate Limiting** | High     | Implement caching; batch API calls; monitor usage; upgrade API tier if needed             |
| **AI Hallucination**           | Medium   | Validate all suggestions against family rules; show confidence scores                     |
| **Family Data Sync Delays**    | Medium   | Implement manual refresh button; graceful handling of sync delays; queue-based processing |
| **Low Initial Adoption**       | Medium   | Beta testing with target users; referral incentives; strong onboarding flow               |
| **Multi-calendar Complexity**  | Medium   | Start with 2-3 calendars per family in MVP; scale later                                   |
| **Timezone Issues**            | Low      | Comprehensive timezone testing; clear UI display of timezone; support documentation       |

---

## 12. Assumptions for Future Phases

### Phase 2 Features (Not in MVP)

- Calendar event creation via app
- Two-way calendar sync (changes written back to source)
- Multi-family account support
- Advanced analytics & historical reporting
- Mobile native apps
- Voice/conversational scheduling
- Integration with other household apps (grocery, chores, etc.)

### Scaling Considerations (100+ families)

- Database query optimization; consider read replicas
- LLM cost optimization; batch processing for non-urgent suggestions
- Calendar API rate limit management; potential multi-provider rotation
- Notification delivery scaling; consider dedicated service (SendGrid, etc.)

---

## Appendix: Glossary

| Term               | Definition                                                                        |
| ------------------ | --------------------------------------------------------------------------------- |
| **Calendar Event** | Individual appointment, meeting, or activity with start time, end time, and title |
| **Hard Conflict**  | Two events with overlapping times                                                 |
| **Soft Conflict**  | No time overlap, but logistical constraint prevents both (e.g., travel time)      |
| **Family Admin**   | Account owner; can manage family members and settings                             |
| **Family Member**  | Person in family (may or may not have own calendar)                               |
| **Calendar Sync**  | Automated process polling external calendar APIs for new/changed events           |
| **Suggestion**     | AI-generated recommendation to resolve conflict or optimize schedule              |
| **Notification**   | Alert to user about upcoming event or detected conflict                           |
| **Rule**           | User-defined constraint (e.g., "Jake unavailable Tue-Thu 4-6 PM")                 |

---

## Document History

| Version | Date           | Author             | Changes                   |
| ------- | -------------- | ------------------ | ------------------------- |
| 1.0     | March 11, 2026 | Specification Team | Initial MVP specification |
