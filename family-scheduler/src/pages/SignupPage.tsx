import { useState, FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import type { SignupFormData } from "../types/auth"

export default function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<SignupFormData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    setLoading(true)

    const { error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName },
      },
    })

    setLoading(false)

    if (authError) {
      setError(authError.message)
    } else {
      setSuccess(true)
      setTimeout(() => navigate("/login"), 3000)
    }
  }

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.successTitle}>Check your email</h2>
          <p style={styles.successText}>
            We sent a confirmation link to <strong>{form.email}</strong>.
            Confirm it to activate your account.
          </p>
          <p style={styles.successRedirect}>Redirecting to login…</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Family Scheduler</h1>
          <p style={styles.subtitle}>Create your account</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label htmlFor="fullName" style={styles.label}>
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              required
              autoComplete="name"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              style={styles.input}
              placeholder="Jane Smith"
            />
          </div>

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
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={styles.input}
              placeholder="Min. 8 characters"
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="confirmPassword" style={styles.label}>
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
              style={styles.input}
              placeholder="••••••••"
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>
            Sign in
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
  successIcon: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    border: "2px solid #34d399",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.75rem",
    color: "#34d399",
    margin: "0 auto 1.5rem",
  },
  successTitle: {
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "#e2e8f0",
    textAlign: "center",
    margin: "0 0 1rem",
  },
  successText: {
    fontSize: "0.95rem",
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 1.6,
    margin: "0 0 0.75rem",
  },
  successRedirect: {
    fontSize: "0.8rem",
    color: "#64748b",
    textAlign: "center",
    margin: 0,
  },
}
