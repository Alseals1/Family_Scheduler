import { useEffect, useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import type { Session } from "@supabase/supabase-js"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "./lib/supabase"
import LoginPage from "./pages/LoginPage"
import SignupPage from "./pages/SignupPage"
import CalendarsPage from "./pages/CalendarsPage"
import ConnectCalendar from "./components/ConnectCalendar"
import { useCurrentMember } from "./hooks/useCurrentMember"
import { useCalendarEvents } from "./hooks/useCalendarEvents"
import type { CalendarEvent } from "./hooks/useCalendarEvents"

function ProtectedRoute({
  session,
  children,
}: {
  session: Session | null
  children: React.ReactNode
}) {
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

// ─── Week-view helpers ────────────────────────────────────────────────────────

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day // shift to Monday
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })
}

// ─── Week view component ──────────────────────────────────────────────────────

function WeekView({
  events,
  weekMonday,
}: {
  events: CalendarEvent[]
  weekMonday: Date
}) {
  const days = getWeekDays(weekMonday)

  const byDay: Record<string, CalendarEvent[]> = {}
  for (const day of days) byDay[toDateKey(day)] = []
  for (const ev of events) {
    const key = toDateKey(new Date(ev.start_at))
    if (key in byDay) byDay[key].push(ev)
  }

  const todayKey = toDateKey(new Date())
  const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  return (
    <div style={weekStyles.grid}>
      {days.map((day, i) => {
        const key = toDateKey(day)
        const isToday = key === todayKey
        const dayEvents = byDay[key]

        return (
          <div
            key={key}
            style={{
              ...weekStyles.column,
              ...(isToday ? weekStyles.todayColumn : {}),
            }}
          >
            <div style={weekStyles.dayHeader}>
              <span style={weekStyles.dayName}>{DAY_NAMES[i]}</span>
              <span
                style={{
                  ...weekStyles.dayNumber,
                  ...(isToday ? weekStyles.todayNumber : {}),
                }}
              >
                {day.getDate()}
              </span>
            </div>
            <div style={weekStyles.eventList}>
              {dayEvents.length === 0 ? (
                <span style={weekStyles.noEvents}>—</span>
              ) : (
                dayEvents.map((ev) => (
                  <div key={ev.id} style={weekStyles.eventCard}>
                    <div style={weekStyles.eventTime}>
                      {formatTime(ev.start_at)}
                    </div>
                    <div style={weekStyles.eventTitle}>{ev.title}</div>
                    {ev.location && (
                      <div style={weekStyles.eventLocation}>{ev.location}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ session }: { session: Session }) {
  const queryClient = useQueryClient()
  const { data: member } = useCurrentMember(session.user.id)
  const { data: events = [], isLoading: eventsLoading } = useCalendarEvents(
    member?.id,
  )

  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [syncSuccess, setSyncSuccess] = useState(false)

  const [weekMonday, setWeekMonday] = useState(() => startOfWeek(new Date()))

  async function handleSync() {
    if (!member?.id) return
    setSyncing(true)
    setSyncError(null)
    setSyncSuccess(false)

    try {
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-calendar`

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ family_member_id: member.id }),
      })

      const json = await res.json()

      if (!res.ok) {
        setSyncError(json.error ?? json.message ?? `HTTP ${res.status}`)
        setSyncing(false)
        console.error("[sync-calendar] error response:", res.status, json)
        return
      }

      console.log("[sync-calendar] success:", json)
      setSyncing(false)
      setSyncSuccess(true)
      await queryClient.invalidateQueries({
        queryKey: ["calendarEvents", member.id],
      })
      setTimeout(() => setSyncSuccess(false), 3000)
    } catch (err) {
      setSyncing(false)
      setSyncError(err instanceof Error ? err.message : "Network error")
      console.error("[sync-calendar] exception:", err)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  function prevWeek() {
    setWeekMonday((d) => {
      const nd = new Date(d)
      nd.setDate(d.getDate() - 7)
      return nd
    })
  }

  function nextWeek() {
    setWeekMonday((d) => {
      const nd = new Date(d)
      nd.setDate(d.getDate() + 7)
      return nd
    })
  }

  const weekLabel = (() => {
    const days = getWeekDays(weekMonday)
    const first = days[0]
    const last = days[6]
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
    return `${first.toLocaleDateString(undefined, opts)} – ${last.toLocaleDateString(undefined, { ...opts, year: "numeric" })}`
  })()

  return (
    <div style={dashStyles.page}>
      {/* Header */}
      <div style={dashStyles.header}>
        <div>
          <h1 style={dashStyles.title}>Family Scheduler</h1>
          <p style={dashStyles.subtitle}>
            {session.user.user_metadata?.full_name ?? session.user.email}
          </p>
        </div>
        <div style={dashStyles.headerActions}>
          <ConnectCalendar />
          <button onClick={handleSignOut} style={dashStyles.signOutBtn}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Sync toolbar */}
      <div style={dashStyles.toolbar}>
        <div style={dashStyles.weekNav}>
          <button onClick={prevWeek} style={dashStyles.navBtn}>
            ‹
          </button>
          <span style={dashStyles.weekLabel}>{weekLabel}</span>
          <button onClick={nextWeek} style={dashStyles.navBtn}>
            ›
          </button>
          <button
            onClick={() => setWeekMonday(startOfWeek(new Date()))}
            style={dashStyles.todayBtn}
          >
            Today
          </button>
        </div>

        <div style={dashStyles.syncArea}>
          {syncError && <span style={dashStyles.syncError}>{syncError}</span>}
          {syncSuccess && <span style={dashStyles.syncSuccess}>✓ Synced!</span>}
          <button
            onClick={handleSync}
            disabled={syncing || !member?.id}
            style={{
              ...dashStyles.syncBtn,
              ...(syncing || !member?.id ? dashStyles.syncBtnDisabled : {}),
            }}
          >
            {syncing ? (
              <>
                <span style={dashStyles.spinner} />
                Syncing…
              </>
            ) : (
              "⟳  Sync Now"
            )}
          </button>
        </div>
      </div>

      {/* Calendar week view */}
      <div style={dashStyles.calendarBody}>
        {eventsLoading ? (
          <div style={dashStyles.loading}>Loading events…</div>
        ) : (
          <WeekView events={events} weekMonday={weekMonday} />
        )}
      </div>
    </div>
  )
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return null

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={session ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/signup"
          element={session ? <Navigate to="/" replace /> : <SignupPage />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute session={session}>
              <Dashboard session={session!} />
            </ProtectedRoute>
          }
        />
        <Route path="/calendars" element={<CalendarsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

// ─── Styles ───────────────────────────────────────────────────────────────────

const dashStyles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    color: "#e2e8f0",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1.25rem 2rem",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    backgroundColor: "rgba(30,30,46,0.7)",
    backdropFilter: "blur(8px)",
    flexWrap: "wrap",
    gap: "1rem",
  },
  title: {
    margin: 0,
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "#e2e8f0",
  },
  subtitle: {
    margin: "0.25rem 0 0",
    fontSize: "0.85rem",
    color: "#94a3b8",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  signOutBtn: {
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.15)",
    backgroundColor: "transparent",
    color: "#94a3b8",
    fontSize: "0.875rem",
    cursor: "pointer",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.875rem 2rem",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    backgroundColor: "rgba(30,30,46,0.4)",
    flexWrap: "wrap",
    gap: "0.75rem",
  },
  weekNav: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  navBtn: {
    width: "2rem",
    height: "2rem",
    borderRadius: "6px",
    border: "1px solid rgba(255,255,255,0.15)",
    backgroundColor: "transparent",
    color: "#e2e8f0",
    fontSize: "1.2rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  weekLabel: {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#e2e8f0",
    minWidth: "14rem",
    textAlign: "center",
  },
  todayBtn: {
    padding: "0.3rem 0.75rem",
    borderRadius: "6px",
    border: "1px solid rgba(99,102,241,0.5)",
    backgroundColor: "rgba(99,102,241,0.1)",
    color: "#818cf8",
    fontSize: "0.8rem",
    cursor: "pointer",
  },
  syncArea: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  syncBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.55rem 1.25rem",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#6366f1",
    color: "#fff",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  syncBtnDisabled: {
    backgroundColor: "#3f3f5e",
    color: "#6b7280",
    cursor: "not-allowed",
  },
  spinner: {
    display: "inline-block",
    width: "0.9rem",
    height: "0.9rem",
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.25)",
    borderTop: "2px solid #fff",
    animation: "spin 0.75s linear infinite",
  },
  syncError: {
    fontSize: "0.8rem",
    color: "#f87171",
  },
  syncSuccess: {
    fontSize: "0.8rem",
    color: "#34d399",
    fontWeight: 600,
  },
  calendarBody: {
    flex: 1,
    padding: "1.5rem 2rem",
    overflowX: "auto",
  },
  loading: {
    color: "#94a3b8",
    textAlign: "center",
    paddingTop: "3rem",
    fontSize: "0.95rem",
  },
}

const weekStyles: Record<string, React.CSSProperties> = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(120px, 1fr))",
    gap: "0.5rem",
    minWidth: "840px",
  },
  column: {
    backgroundColor: "rgba(30,30,46,0.5)",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.06)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  todayColumn: {
    border: "1px solid rgba(99,102,241,0.45)",
    backgroundColor: "rgba(99,102,241,0.07)",
  },
  dayHeader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "0.6rem 0.5rem 0.5rem",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  dayName: {
    fontSize: "0.7rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "#64748b",
  },
  dayNumber: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#cbd5e1",
    lineHeight: 1.2,
  },
  todayNumber: {
    color: "#818cf8",
  },
  eventList: {
    flex: 1,
    padding: "0.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
    minHeight: "6rem",
  },
  noEvents: {
    color: "#334155",
    fontSize: "0.8rem",
    textAlign: "center",
    marginTop: "0.75rem",
  },
  eventCard: {
    backgroundColor: "rgba(99,102,241,0.18)",
    border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: "6px",
    padding: "0.35rem 0.5rem",
    cursor: "default",
  },
  eventTime: {
    fontSize: "0.68rem",
    color: "#818cf8",
    fontWeight: 600,
    marginBottom: "0.1rem",
  },
  eventTitle: {
    fontSize: "0.78rem",
    color: "#e2e8f0",
    fontWeight: 500,
    lineHeight: 1.3,
    wordBreak: "break-word",
  },
  eventLocation: {
    fontSize: "0.68rem",
    color: "#64748b",
    marginTop: "0.15rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
}
