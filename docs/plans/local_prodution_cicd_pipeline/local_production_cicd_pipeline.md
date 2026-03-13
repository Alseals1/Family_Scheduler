# Local Dev → Staging → Production Pipeline

> **Who this is for:** Junior devs and anyone new to the project who wants to understand  
> why the environment setup works the way it does—written in plain English.

---

## The Big Picture

We have **three environments**:

| Environment    | What it is                      | Supabase                                   | Branch             |
| -------------- | ------------------------------- | ------------------------------------------ | ------------------ |
| **Local**      | Your laptop, only you see it    | Local Docker container (`127.0.0.1:54321`) | any feature branch |
| **Staging**    | Shared dev server, team sees it | Remote Supabase (production DB)            | `dev`              |
| **Production** | The real app, users see it      | Remote Supabase                            | `main`             |

> ⚠️ **Important:** Right now staging and production share the same remote Supabase database.  
> That's fine for a small team early on. Later you can create a separate Supabase project for staging.

---

## Why Two Environments Locally?

Imagine you're building a new feature that requires a new database column. If you test against the live production database and something goes wrong, **real users are affected**. With a local database:

- You can break things freely
- You can reset to a clean state anytime (`supabase db reset`)
- Your test users and fake data never pollute production
- Email confirmations go to a fake inbox (Mailpit) — no real emails sent

---

## How Environment Variables Work (Vite)

Vite (our frontend build tool) reads `.env` files and makes anything prefixed with `VITE_` available to the React app.

**The loading order is:**

```
.env          ← always loaded (committed to git, production values)
.env.local    ← loaded second, OVERRIDES .env (gitignored, local values)
```

This means:

| Where you run the app                | Files loaded                  | Which Supabase             |
| ------------------------------------ | ----------------------------- | -------------------------- |
| `npm run dev` on your laptop         | `.env` + `.env.local`         | Local Docker (`127.0.0.1`) |
| `npm run build` in GitHub Actions CI | `.env` only (no `.env.local`) | Remote production          |
| Deployed on Vercel (future)          | Vercel dashboard env vars     | Remote production          |

**You don't have to change any code or manually switch anything.** Just having `.env.local` present on your machine is enough.

---

## File Structure

```
family_ai_scheduler/
├── .env.local                          ← ROOT-level project notes only (not Vite)
├── .github/
│   └── workflows/
│       └── ci.yml                      ← GitHub Actions: lint + build on push
└── family-scheduler/                   ← The React app
    ├── .env                            ← Production credentials (committed to git)
    ├── .env.local                      ← Local overrides (gitignored, lives only on your machine)
    └── src/
        └── lib/
            └── supabase.ts             ← Reads VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
```

> **Note:** `.env.local` is already covered by the `*.local` rule in `.gitignore`.  
> You'll never accidentally commit it.

---

## Step-by-Step: Running Locally

### First time setup

```bash
# 1. Install dependencies
cd family-scheduler
npm install

# 2. Start local Supabase (Docker must be running)
supabase start

# 3. Run the app
npm run dev
```

### Check it's working

- App: `http://localhost:5173`
- Supabase Studio (local DB viewer): `http://127.0.0.1:54323`
- Mailpit (fake email inbox): `http://127.0.0.1:54324`

When you sign up locally, the confirmation email goes to **Mailpit**, not a real inbox. You can click the link there to confirm.

### Resetting the local database

```bash
supabase db reset
```

This drops everything and re-runs all migrations fresh. Useful when testing signup flows or schema changes.

---

## Step-by-Step: The CI/CD Pipeline

### What is CI/CD?

- **CI (Continuous Integration):** Every time you push code, automated checks run (lint, build). Catches mistakes before merging.
- **CD (Continuous Delivery/Deployment):** Automatically deploying passing code to an environment.

### How our pipeline works

```
You push code to GitHub
        │
        ▼
GitHub Actions triggers (.github/workflows/ci.yml)
        │
        ├─ Step 1: Install dependencies (npm ci)
        ├─ Step 2: Lint (checks code style/errors)
        └─ Step 3: Build (compiles TypeScript + Vite bundle)
                        │
                        ├─ ✅ Pass → PR can be merged
                        └─ ❌ Fail → You get an email, fix the error
```

### Branch strategy

```
feature/my-new-thing
        │
        │  (PR review + CI must pass)
        ▼
      dev ──────────────────────────► staging environment
        │
        │  (PR review + CI must pass)
        ▼
      main ─────────────────────────► production environment
```

- **feature branches** → always branch off `dev`, not `main`
- **`dev`** → staging. Safe to merge work-in-progress features here for team review
- **`main`** → production. Only merge when you're confident it's ready for users

### Making a migration safe to deploy

If your feature includes a **database migration** (new table, new column, etc.):

1. Write and test it locally first (`supabase db reset` to verify it applies cleanly)
2. After merging to `dev`, push the migration to remote: `supabase db push`
3. Verify on staging before merging to `main`

---

## Future: Vercel Deploy

When you're ready to host publicly on Vercel (free tier available):

1. Go to [vercel.com](https://vercel.com) → Import project → Connect this GitHub repo
2. Set root directory to `family-scheduler`
3. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL` = (your production Supabase URL)
   - `VITE_SUPABASE_ANON_KEY` = (your production anon key)
4. Vercel auto-deploys on every push to `main`
5. Optionally uncomment the deploy block in `ci.yml` if you want GitHub Actions to trigger it manually

Vercel is free for personal/hobby projects and handles global CDN, HTTPS, and preview URLs for PRs automatically. No server config needed.

---

## Gotchas

| Gotcha                                               | Fix                                                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `npm run dev` still hitting remote Supabase          | Check that `.env.local` exists in `family-scheduler/`, not the root                        |
| Local signup not creating family row                 | Run `supabase db reset` to re-apply the trigger migration                                  |
| CI build fails with "Cannot find module"             | Run `npm ci` locally to reproduce, likely a missing dependency                             |
| `supabase start` fails                               | Make sure Docker Desktop is running                                                        |
| Migrations not applied locally after pulling changes | Run `supabase db reset` to pick up new migration files                                     |
| `.env.local` accidentally committed                  | Run `git rm --cached family-scheduler/.env.local` then re-add `.env.local` to `.gitignore` |

---

## Quick Reference

```bash
# Start local env
supabase start && npm run dev

# Stop local Supabase
supabase stop

# Reset local DB (re-runs all migrations)
supabase db reset

# Push new migration to remote
supabase db push

# See what supabase is running
supabase status
```
