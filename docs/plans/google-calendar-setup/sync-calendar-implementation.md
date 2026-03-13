# Sync Calendar: Implementation Theory & Architecture

This document explains the **why** and **how** behind the `sync-calendar` Supabase Edge Function, written for humans and junior developers.

---

## Part 1: The Big Picture

### What Problem Does This Solve?

Family members have their calendars on Google Calendar. We need to:
1. **Pull** their events into our database
2. Keep that data **fresh** (automatically re-sync periodically)
3. Find **conflicts** (two family members busy at the same time)
4. Let the AI **read real data** to answer scheduling questions

Without this function, the `events` table would be empty, and the app would have no calendar data to work with.

---

## Part 2: Architecture Decisions

### Why an Edge Function?

An **Edge Function** is server-side code that runs in Supabase's infrastructure. We chose this instead of:
- ❌ **Frontend code**: Can't call Google API directly (CORS issues, exposes secrets)
- ❌ **Database trigger**: Too limited; can't make HTTP requests reliably
- ✅ **Edge Function**: Server-side, can call Google API, can write to database

### Why Use the Service Role Key?

The Edge Function runs **server-side only**, so:
- It uses `SUPABASE_SERVICE_ROLE_KEY` to bypass Row Level Security (RLS)
- If the user makes the request from the frontend, RLS still protects their data
- Only the Edge Function itself can access all calendar connections

### Why Upsert Instead of Insert?

The unique constraint `(calendar_connection_id, external_id)` ensures:
- **First sync**: Inserts all 50 events
- **Second sync**: Updates those 50 events + inserts any new ones
- **No duplicates**: Same Google event ID → same row in `events`

---

## Part 3: Step-by-Step Flow

### Step 1: User Invokes the Function

```javascript
// From the frontend (TASK-014):
supabase.functions.invoke('sync-calendar', {
  body: { family_member_id: "uuid-of-mom" }
})
```

The `family_member_id` tells the function: "Sync all Google calendars for this person."

---

### Step 2: Fetch Calendar Connections

The function queries:
```sql
SELECT id, family_member_id, provider, access_token, refresh_token, token_expires_at
FROM calendar_connections
WHERE family_member_id = ? AND provider = 'google'
```

**Why only Google?** Because this function only knows how to talk to Google Calendar API. (Outlook/Apple would need separate logic.)

**Why separate connections?** One family member might have multiple calendars (work + personal + other). Each connection stores different tokens.

---

### Step 3: Check If Token is Expired

Google access tokens expire (usually in 1 hour). When they do, we need to exchange the **refresh token** for a new **access token**.

```javascript
const expiresAtMs = new Date(conn.token_expires_at).getTime();
const nowMs = Date.now();
if (expiresAtMs - nowMs < 5 * 60 * 1000) {  // Within 5 minutes?
  // Get new token
}
```

**Why 5 minutes buffer?** Network latency. If we wait until the token is 100% expired, it might fail mid-request.

---

### Step 4: Refresh the Token (If Needed)

Call Google's OAuth endpoint:

```
POST https://oauth2.googleapis.com/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
refresh_token=<refresh_token_from_db>
client_id=<from_env>
client_secret=<from_env>
```

Google responds:
```json
{
  "access_token": "new_token_xyz",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

We then **update the database** with the new token and expiration time.

**Why update the DB?** The next sync (in an hour?) will reuse the refreshed token instead of asking Google again.

---

### Step 5: Fetch Events from Google Calendar

Use the fresh access token:

```
GET https://www.googleapis.com/calendar/v3/calendars/primary/events?
  timeMin=2026-03-13T00:00:00Z&
  timeMax=2026-04-12T00:00:00Z&
  singleEvents=true&
  orderBy=startTime&
  maxResults=250
```

**What do these parameters mean?**
- `timeMin` / `timeMax`: Only events in the next 30 days (prevents data bloat)
- `singleEvents=true`: Recurring events become individual instances (Mom's weekly yoga appears 4x, not 1x with recurrence rules)
- `orderBy=startTime`: Sorted chronologically (nice to have)
- `maxResults=250`: Hard limit; most families won't hit this

**Response is an array:**
```json
{
  "items": [
    {
      "id": "google_event_id_123",
      "summary": "Doctor appointment",
      "start": { "dateTime": "2026-03-15T10:00:00" },
      "end": { "dateTime": "2026-03-15T11:00:00" },
      "location": "123 Main St",
      "description": "Annual checkup"
    },
    // ... more events
  ]
}
```

---

### Step 6: Transform Google Events → Our Format

Google's format doesn't match our database schema. We transform each event:

```javascript
{
  calendar_connection_id: "uuid-of-connection",  // Links to calendar_connections
  external_id: event.id,                         // Google's ID (for uniqueness)
  title: event.summary || "(No title)",          // Fallback if untitled
  start_at: event.start.dateTime,                // ISO timestamp
  end_at: event.end.dateTime,                    // ISO timestamp
  location: event.location || null,              // Can be null
  description: event.description || null         // Can be null
}
```

**Why `external_id`?** So we can match "the same event" on future syncs. If Mom changes the event title in Google, the `external_id` stays the same, so we update the row instead of creating a duplicate.

---

### Step 7: Upsert Into Events Table

```sql
INSERT INTO events (calendar_connection_id, external_id, title, start_at, end_at, location, description)
VALUES (...)
ON CONFLICT (calendar_connection_id, external_id) DO UPDATE SET
  title = EXCLUDED.title,
  start_at = EXCLUDED.start_at,
  end_at = EXCLUDED.end_at,
  location = EXCLUDED.location,
  description = EXCLUDED.description
```

**What's happening?**
- If no row exists for this `(calendar_connection_id, external_id)`: **INSERT** (new event)
- If a row exists: **UPDATE** it (event was edited in Google)

**Why upsert?** It's idempotent — you can run it 10 times and get the same result.

---

### Step 8: Update the Sync Timestamp

```sql
UPDATE calendar_connections
SET last_synced_at = now()
WHERE id = ?
```

This records "we last synced this connection at 2026-03-13 14:23:45". Useful for debugging and UI indicators ("Last synced 2 hours ago").

---

### Step 9: Return Success

```json
{
  "success": true,
  "events_synced": 47
}
```

The frontend can show: "✅ Synced 47 events!"

---

## Part 4: Key Design Decisions Explained

### Why Service Role Key?

Without it, the Edge Function couldn't insert into `events` because RLS policies restrict writes to the owner's family only. Using the service role bypasses RLS, which is safe because:
1. The Edge Function runs **server-side only** (not callable from frontend with service role)
2. The function explicitly checks `family_member_id` before proceeding
3. The actual `events` are still protected by RLS when the frontend queries them

### Why 30-Day Window?

- 🟢 **Fast**: Fetches only recent events
- 🟢 **Stays fresh**: Catches new events, updates changed ones, deletes old ones
- 🟢 **Reasonable scope**: Captures most family scheduling needs
- 🔴 **Trade-off**: Won't sync historical data from 2 years ago

### Why Check Token Expiration 5 Minutes Early?

- Network round-trips take time
- If we wait until `token_expires_at = now()`, the refresh request might fail mid-flight
- 5-minute buffer handles network slowness safely

### Why Filter Out Events Missing Dates?

```javascript
.filter(e => e.id && (e.start.dateTime || e.start.date) && (e.end.dateTime || e.end.date))
```

Google can return:
- ✅ Timed events: `start: { dateTime: "2026-03-15T10:00:00" }`
- ✅ All-day events: `start: { date: "2026-03-15" }`
- ❌ Broken events: Missing `start` or `end` (rare, but possible)

We discard broken events gracefully instead of crashing.

---

## Part 5: What Happens Next

### After sync-calendar completes:

1. **TASK-014** (next): Add a "Sync Now" button on the UI that calls this function
2. **TASK-015**: Create `detect-conflicts` function to find overlapping events
3. **TASK-016**: Auto-run `detect-conflicts` after each sync (Chain Edge Functions!)

### Future Enhancements

- **Automated sync**: Use Supabase's `pg_cron` extension to run `sync-calendar` every hour
- **Soft deletes**: Track which events Google returned, delete events that are gone
- **Outlook/Apple**: Add separate logic for other calendar providers
- **Error logging**: Store sync errors in a `sync_logs` table for debugging

---

## Part 6: Environment Variables You Need

Before deploying, set:

```bash
supabase secrets set GOOGLE_CLIENT_ID=<from-google-cloud-console>
supabase secrets set GOOGLE_CLIENT_SECRET=<from-google-cloud-console>
```

These come from your **Google Cloud Console** → **Credentials** → **OAuth 2.0 Client ID**.

Not set? The function will crash when trying to refresh tokens.

---

## Part 7: Testing Locally

```bash
# Start Supabase local (in separate terminal)
npm run supabase:start

# In another terminal, serve the function
supabase functions serve sync-calendar

# In a third terminal, test it
curl -X POST http://localhost:54321/functions/v1/sync-calendar \
  -H "Content-Type: application/json" \
  -d '{"family_member_id": "<paste-a-real-uuid-from-your-db>"}'
```

**Expected response (success):**
```json
{ "success": true, "events_synced": 42 }
```

**Check the database:**
```sql
SELECT * FROM events LIMIT 10;
```

You should see real events from Google Calendar!

---

## Part 8: Common Gotchas

| Problem | Cause | Fix |
|---------|-------|-----|
| `{"error": "No Google calendar connections..."}`  | No OAuth flow completed yet (TASK-012) | Complete TASK-012 first |
| `{"error": "... 401 Unauthorized"}` | Google token is invalid | Refresh token might be revoked; re-authenticate |
| Events don't appear | `calendar_connection_id` doesn't exist | Check the foreign key matches |
| Token never refreshes | `token_expires_at` is a string, not a timestamp | Check Supabase migration for correct type |
| Function times out | Google API is slow or network is spotty | Increase timeout, add retry logic |

---

## Summary

```
User clicks "Sync Now"
  ↓
frontend: supabase.functions.invoke('sync-calendar', { body: { family_member_id } })
  ↓
Edge Function receives request
  ↓
Query: Get calendar_connections for this family member
  ↓
For each connection:
  → Check if access_token is expired
  → If yes, call Google OAuth to get new token
  → Update DB with fresh token
  → Call Google Calendar API to fetch 30 days of events
  → Transform Google format → Our format
  → Upsert into events table (idempotent)
  → Update last_synced_at
  ↓
Return: { success: true, events_synced: 42 }
  ↓
Frontend shows "✅ Synced 42 events!"
  ↓
User can now see real calendar events in the app
```

---

**Next Step for Junior Dev:**

1. Read this doc
2. Look at the actual code in `supabase/functions/sync-calendar/index.ts`
3. Cross-reference each section of code with the explanations above
4. Deploy locally and test with real Google Calendar data
5. Debug any issues using the "Common Gotchas" table

Welcome to the codebase! 🎉
