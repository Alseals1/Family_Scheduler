import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

interface CalendarConnection {
  id: string
  family_member_id: string
  provider: string
  access_token: string
  refresh_token: string
  token_expires_at: string
}

interface GoogleEvent {
  id: string
  summary?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  location?: string
  description?: string
}

async function refreshAccessToken(
  refreshToken: string,
): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Google token refresh failed (${res.status}): ${body}`)
  }

  return res.json()
}

async function fetchGoogleEvents(accessToken: string): Promise<GoogleEvent[]> {
  const now = new Date()
  const timeMin = now.toISOString()
  const timeMax = new Date(
    now.getTime() + 30 * 24 * 60 * 60 * 1000,
  ).toISOString()

  const url = new URL(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
  )
  url.searchParams.set("timeMin", timeMin)
  url.searchParams.set("timeMax", timeMax)
  url.searchParams.set("singleEvents", "true")
  url.searchParams.set("orderBy", "startTime")
  url.searchParams.set("maxResults", "250")

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Google Calendar API failed (${res.status}): ${body}`)
  }

  const data = await res.json()
  return (data.items ?? []) as GoogleEvent[]
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS })
  }

  try {
    const body = await req.json()
    const { family_member_id } = body as { family_member_id?: string }

    if (!family_member_id) {
      return new Response(
        JSON.stringify({ error: "family_member_id is required" }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      )
    }

    // Use service role to bypass RLS — this function runs server-side only
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Fetch all Google calendar connections for this family member
    const { data: connections, error: connError } = await supabase
      .from("calendar_connections")
      .select(
        "id, family_member_id, provider, access_token, refresh_token, token_expires_at",
      )
      .eq("family_member_id", family_member_id)
      .eq("provider", "google")

    if (connError) throw connError

    if (!connections || connections.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No Google calendar connections found for this family member",
        }),
        {
          status: 404,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      )
    }

    let totalSynced = 0

    for (const conn of connections as CalendarConnection[]) {
      let accessToken = conn.access_token

      // Refresh the access token if it expires within the next 5 minutes
      const expiresAtMs = new Date(conn.token_expires_at).getTime()
      const nowMs = Date.now()
      if (expiresAtMs - nowMs < 5 * 60 * 1000) {
        const refreshed = await refreshAccessToken(conn.refresh_token)
        accessToken = refreshed.access_token
        const newExpiresAt = new Date(
          nowMs + refreshed.expires_in * 1000,
        ).toISOString()

        const { error: updateErr } = await supabase
          .from("calendar_connections")
          .update({ access_token: accessToken, token_expires_at: newExpiresAt })
          .eq("id", conn.id)

        if (updateErr) throw updateErr
      }

      // Fetch events from Google Calendar for the next 30 days
      const googleEvents = await fetchGoogleEvents(accessToken)

      // Build rows to upsert, filtering out any events missing required fields
      const eventsToUpsert = googleEvents
        .filter(
          (e) =>
            e.id &&
            (e.start.dateTime || e.start.date) &&
            (e.end.dateTime || e.end.date),
        )
        .map((e) => ({
          calendar_connection_id: conn.id,
          external_id: e.id,
          title: e.summary ?? "(No title)",
          // All-day events use `date`; timed events use `dateTime`
          start_at: e.start.dateTime ?? `${e.start.date}T00:00:00Z`,
          end_at: e.end.dateTime ?? `${e.end.date}T00:00:00Z`,
          location: e.location ?? null,
          description: e.description ?? null,
        }))

      if (eventsToUpsert.length > 0) {
        // onConflict matches the unique(calendar_connection_id, external_id) constraint
        const { error: upsertErr } = await supabase
          .from("events")
          .upsert(eventsToUpsert, {
            onConflict: "calendar_connection_id,external_id",
          })

        if (upsertErr) throw upsertErr
        totalSynced += eventsToUpsert.length
      }

      // Record the sync timestamp
      await supabase
        .from("calendar_connections")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", conn.id)
    }

    return new Response(
      JSON.stringify({ success: true, events_synced: totalSynced }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    )
  } catch (err) {
    console.error("[sync-calendar]", err)
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unexpected error",
      }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    )
  }
})
