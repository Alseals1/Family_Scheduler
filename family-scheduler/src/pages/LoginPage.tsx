import { useState } from "react"
import type { FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import type { LoginFormData } from "../types/auth"

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<LoginFormData>({ email: "", password: "" })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    setLoading(false)

    if (authError) {
      setError(authError.message)
    } else {
      navigate("/")
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Family Scheduler</h1>
          <p style={styles.subtitle}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label htmlFor="email" style={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={styles.input}
              placeholder="you@example.com"
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="password" style={styles.label}>
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={styles.input}
              placeholder="••••••••"
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p style={styles.footer}>
          Don't have an account?{" "}
          <Link to="/signup" style={styles.link}>
            Sign up
          </Link>
        </p>
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
  },
  header: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "#e2e8f0",
    margin: "0 0 0.5rem",
  },
  subtitle: {
    fontSize: "0.95rem",
    color: "#94a3b8",
    margin: 0,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  label: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#cbd5e1",
  },
  input: {
    padding: "0.65rem 0.875rem",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    backgroundColor: "#0f0f1a",
    color: "#e2e8f0",
    fontSize: "0.95rem",
    outline: "none",
    transition: "border-color 0.2s",
  },
  error: {
    fontSize: "0.875rem",
    color: "#f87171",
    backgroundColor: "rgba(248, 113, 113, 0.1)",
    border: "1px solid rgba(248, 113, 113, 0.2)",
    borderRadius: "8px",
    padding: "0.6rem 0.875rem",
    margin: 0,
  },
  button: {
    padding: "0.75rem",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#6366f1",
    color: "#fff",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background-color 0.2s, opacity 0.2s",
    marginTop: "0.25rem",
  },
  footer: {
    textAlign: "center",
    marginTop: "1.5rem",
    fontSize: "0.875rem",
    color: "#94a3b8",
  },
  link: {
    color: "#818cf8",
    fontWeight: 500,
  },
}
