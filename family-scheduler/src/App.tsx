import { useEffect, useState } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "./lib/supabase"
import LoginPage from "./pages/LoginPage"
import SignupPage from "./pages/SignupPage"

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

function Dashboard({ session }: { session: Session }) {
  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <div style={{ padding: "2rem", color: "#e2e8f0" }}>
      <h1>
        Welcome, {session.user.user_metadata?.full_name ?? session.user.email}!
      </h1>
      <p style={{ color: "#94a3b8" }}>
        Your family scheduler dashboard is coming soon.
      </p>
      <button onClick={handleSignOut} style={{ marginTop: "1rem" }}>
        Sign Out
      </button>
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
