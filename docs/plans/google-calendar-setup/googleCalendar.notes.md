# Google Calendar Integration — How It Works

> **Who this is for:** Junior devs, new team members, or your future self trying  
> to remember why things are set up this way. Written in plain English.

---

## The Big Picture

Users sign up with email/password, then **connect their Google Calendar** so the app
can read their events. Two separate OAuth flows are involved:

```
┌─────────────────────────────────────────────────────────────┐
│                    OAuth Flow #1 (Auth)                      │
│  User signs up / logs in with email & password               │
│  → Creates a row in auth.users                               │
│  → DB trigger auto-creates a families row                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 OAuth Flow #2 (Calendar)                     │
│  User clicks "Connect Google Calendar" on the dashboard      │
│  → Redirects to Google → user grants calendar.readonly       │
│  → Google redirects back to /calendars with tokens           │
│  → App saves tokens to calendar_connections table            │
└─────────────────────────────────────────────────────────────┘
```

**Key distinction:** Flow #1 is for _authentication_ (who are you?). Flow #2 is for
_authorization_ (can we read your calendar?). Supabase lets us piggyback Flow #2
on top of `signInWithOAuth` — it re-authenticates the user via Google AND requests
the extra `calendar.readonly` scope in one shot.

---

## Architecture Overview

```
src/
├── components/
│   └── ConnectCalendar.tsx     ← "Connect Google Calendar" button
├── pages/
│   └── CalendarsPage.tsx       ← OAuth callback handler + token saver
├── lib/
│   └── supabase.ts             ← Supabase client (reads from .env / .env.local)
└── App.tsx                     ← Route: /calendars → CalendarsPage
```

### Database Tables Involved

```
families              ← auto-created on signup (by DB trigger)
  └── family_members  ← auto-created on first calendar connect (by CalendarsPage)
       └── calendar_connections  ← stores Google access + refresh tokens
            └── events           ← synced from Google Calendar API (future: TASK-013)
```

---

## How the "Connect Google Calendar" Button Works

### Step 1: User clicks the button

[ConnectCalendar.tsx](../../family-scheduler/src/components/ConnectCalendar.tsx) calls:

```ts
supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    scopes: "https://www.googleapis.com/auth/calendar.readonly",
    redirectTo: window.location.origin + "/calendars",
    queryParams: {
      access_type: "offline", // ← tells Google to give us a refresh_token
      prompt: "consent", // ← forces Google to show the consent screen every time
    },
  },
});
```

**Why `access_type: "offline"`?**
By default, Google only gives you an access token (expires in 1 hour). With `offline`,
Google also returns a `refresh_token` so we can get new access tokens later without
the user being present (e.g., background syncs).

**Why `prompt: "consent"`?**
Google only returns a refresh token the _first_ time a user consents. If you don't
force `consent`, subsequent connects won't get a new refresh token. This ensures
we always get one.

### Step 2: Google redirects back to `/calendars`

After the user approves, Google sends them to Supabase's callback endpoint:

```
http://127.0.0.1:54321/auth/v1/callback
```

Supabase processes the tokens internally, then redirects the user to our `redirectTo` URL:

```
http://localhost:5173/calendars#access_token=...&provider_token=...&provider_refresh_token=...
```

The tokens are in the URL hash fragment (`#`), not query params (`?`). This is a
security measure — hash fragments are never sent to the server, only processed in
the browser.

### Step 3: CalendarsPage saves the tokens

[CalendarsPage.tsx](../../family-scheduler/src/pages/CalendarsPage.tsx) listens for the
`SIGNED_IN` event via `onAuthStateChange`. When it fires, the session object contains:

| Field                            | What it is                              |
| -------------------------------- | --------------------------------------- |
| `session.provider_token`         | Google access token (expires in 1 hour) |
| `session.provider_refresh_token` | Google refresh token (long-lived)       |
| `session.user.id`                | The Supabase user ID                    |

The handler then:

1. **Finds the user's family** — looks up `families` where `created_by = user.id`
2. **Gets or creates a family member** — `calendar_connections` links to `family_members`, not users directly. If no member exists yet, one is created with the user's name and role `"parent"`.
3. **Inserts or updates `calendar_connections`** — upserts the tokens so reconnecting doesn't create duplicate rows.

---

## Config & Environment Setup

### Google Cloud Console

1. **OAuth consent screen** — External, with `calendar.readonly` scope
2. **OAuth 2.0 Client ID** — Web application type
3. **Authorized redirect URIs:**
   - Local: `http://127.0.0.1:54321/auth/v1/callback`
   - Production: `https://oiedxmkabuzeqmwcbcmc.supabase.co/auth/v1/callback`

> The callback goes to _Supabase's_ URL, not your app's URL. Supabase handles the
> code exchange with Google, then redirects the user to your app.

### Supabase config.toml (local)

```toml
[auth]
site_url = "http://localhost:5173"
additional_redirect_urls = [
  "http://localhost:5173",
  "http://localhost:5173/calendars",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5173/calendars"
]

[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
skip_nonce_check = true  # Required for local dev
```

**Why `skip_nonce_check = true`?**
The nonce is a security feature that prevents replay attacks. But for local
development over HTTP, nonce validation doesn't work correctly because the
browser doesn't have a secure context. This flag should be `false` in production.

### .env.local (local, gitignored)

```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<local anon key>

SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<your-google-client-id>
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=<your-google-secret>
```

### Remote Supabase Dashboard (production)

Google provider is configured in: **Authentication → Providers → Google**  
Paste the same Client ID + Secret there.

---

## Gotchas & Troubleshooting

### "Safari can't connect to 127.0.0.1"

Your Vite dev server isn't running. Run `npm run dev` from `family-scheduler/`.

### Google credentials not working locally

The `env(...)` syntax in `config.toml` reads from **shell environment variables**, not
from `.env.local`. Use `npm run supabase:start` which sources `.env.local` before
starting Supabase.

### No refresh token returned

- Make sure `access_type: "offline"` and `prompt: "consent"` are in `queryParams`
- Google only returns a refresh token on _first consent_ unless you force `prompt: "consent"`

### Port confusion: 3000 vs 5173

- Vite runs on **5173** by default
- The default Supabase `config.toml` has `site_url = "http://127.0.0.1:3000"` — this must be updated to 5173
- `additional_redirect_urls` must include your `/calendars` path too

### "Could not find your family" error

The `families` row is created by a DB trigger when a user signs up. If you're testing
with a user created before the trigger migration was applied, backfill manually:

```sql
INSERT INTO families (name, created_by)
SELECT 'My Family', id FROM auth.users
WHERE id NOT IN (SELECT created_by FROM families);
```

### Tokens stored in plaintext

Currently, `access_token` and `refresh_token` are stored as plain text in the
`calendar_connections` table. This is fine for local dev but should be encrypted
at rest using Supabase Vault or similar before going to production.
See: https://supabase.com/docs/guides/database/vault

---

## What Comes Next

| Task         | What it does                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **TASK-013** | Edge Function that reads tokens from `calendar_connections`, calls Google Calendar API, upserts events into `events` table |
| **TASK-014** | "Sync Now" button that invokes the edge function and refreshes the UI                                                      |

---

## Quick Reference: The Token Lifecycle

```
User clicks "Connect Google Calendar"
    │
    ▼
Google OAuth → user grants calendar.readonly
    │
    ▼
Supabase callback receives authorization code
    │
    ▼
Supabase exchanges code for access_token + refresh_token
    │
    ▼
Redirect to /calendars#provider_token=...&provider_refresh_token=...
    │
    ▼
CalendarsPage.tsx saves tokens to calendar_connections
    │
    ▼
(Future) Edge function uses access_token to call Google Calendar API
    │
    ├── Token valid? → Fetch events → upsert to events table
    └── Token expired? → Use refresh_token to get new access_token → retry
```
