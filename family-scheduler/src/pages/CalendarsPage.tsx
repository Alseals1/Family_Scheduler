import { useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import ConnectCalendar from "../components/ConnectCalendar"

type Status = "idle" | "saving" | "saved" | "error"

export default function CalendarsPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    // onAuthStateChange fires with SIGNED_IN immediately after Google redirects
    // back to this page. The session at that point contains provider_token
    // (Google access token) and provider_refresh_token.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.provider_token) {
        await saveCalendarConnection(session)
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function saveCalendarConnection(session: Session) {
    setStatus("saving")
    setErrorMsg(null)

    try {
      // 1. Get the family owned by this user (created automatically on signup)
      const { data: family, error: familyErr } = await supabase
        .from("families")
        .select("id")
        .eq("created_by", session.user.id)
        .limit(1)
        .single()

      if (familyErr || !family) {
        throw new Error(
          "Could not find your family. Try signing out and back in.",
        )
      }

      // 2. Get the first family member, or create one for the account owner.
      //    calendar_connections links to a family_member, not directly to a user.
      let memberId: string

      const { data: existingMember } = await supabase
        .from("family_members")
        .select("id")
        .eq("family_id", family.id)
        .limit(1)
        .single()

      if (existingMember) {
        memberId = existingMember.id
      } else {
        const name =
          session.user.user_metadata?.full_name ?? session.user.email ?? "Me"

        const { data: newMember, error: memberErr } = await supabase
          .from("family_members")
          .insert({ family_id: family.id, name, role: "parent" })
          .select("id")
          .single()

        if (memberErr || !newMember) {
          throw new Error("Could not create a family member record.")
        }

        memberId = newMember.id
      }

      // 3. Check if a Google connection already exists for this member.
      //    If yes — update the tokens. If no — insert a new row.
      const { data: existingConn } = await supabase
        .from("calendar_connections")
        .select("id")
        .eq("family_member_id", memberId)
        .eq("provider", "google")
        .limit(1)
        .single()

      // Google access tokens expire in 1 hour
      const tokenExpiresAt = new Date(Date.now() + 3600 * 1000).toISOString()

      if (existingConn) {
        await supabase
          .from("calendar_connections")
          .update({
            access_token: session.provider_token,
            refresh_token: session.provider_refresh_token ?? null,
            token_expires_at: tokenExpiresAt,
          })
          .eq("id", existingConn.id)
      } else {
        await supabase.from("calendar_connections").insert({
          family_member_id: memberId,
          provider: "google",
          calendar_name: "Google Calendar",
          access_token: session.provider_token,
          refresh_token: session.provider_refresh_token ?? null,
          token_expires_at: tokenExpiresAt,
        })
      }

      setStatus("saved")
      setTimeout(() => navigate("/"), 2500)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.")
      setStatus("error")
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {status === "idle" && (
          <>
            <h2 style={styles.title}>Connect a Calendar</h2>
            <p style={styles.subtitle}>
              Link your Google Calendar to start seeing your family's events.
            </p>
            <ConnectCalendar />
          </>
        )}

        {status === "saving" && (
          <>
            <div style={styles.spinner} />
            <p style={styles.subtitle}>Saving your calendar connection…</p>
          </>
        )}

        {status === "saved" && (
          <>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.title}>Calendar connected!</h2>
            <p style={styles.subtitle}>Redirecting you to the dashboard…</p>
          </>
        )}

        {status === "error" && (
          <>
            <h2 style={styles.title}>Something went wrong</h2>
            <p style={styles.error}>{errorMsg}</p>
            <ConnectCalendar />
          </>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
    background:
      "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    backgroundColor: "#1e1e2e",
    borderRadius: "16px",
    padding: "2.5rem",
    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1.25rem",
    textAlign: "center",
  },
  title: {
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "#e2e8f0",
    margin: 0,
  },
  subtitle: {
    fontSize: "0.95rem",
    color: "#94a3b8",
    margin: 0,
  },
  error: {
    fontSize: "0.875rem",
    color: "#f87171",
    backgroundColor: "rgba(248, 113, 113, 0.1)",
    border: "1px solid rgba(248, 113, 113, 0.2)",
    borderRadius: "8px",
    padding: "0.6rem 0.875rem",
    margin: 0,
    width: "100%",
    boxSizing: "border-box",
  },
  successIcon: {
    width: "3rem",
    height: "3rem",
    borderRadius: "50%",
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    color: "#34d399",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.4rem",
    fontWeight: 700,
  },
  spinner: {
    width: "2rem",
    height: "2rem",
    border: "3px solid rgba(255,255,255,0.1)",
    borderTop: "3px solid #6366f1",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
}
