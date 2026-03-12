# Authentication & Authorization Overview

## Architecture

**Auth Provider:** Supabase (PostgreSQL + built-in auth)  
**Flow:** Email/password signup → confirmation email → login session → protected routes

## Key Files

- `src/types/auth.ts` — TypeScript interfaces for forms
- `src/pages/LoginPage.tsx` — Login form + `supabase.auth.signInWithPassword()`
- `src/pages/SignupPage.tsx` — Signup form + `supabase.auth.signUp()`
- `src/App.tsx` — Route protection + session state management

## Session Flow

1. **App mounts** → `supabase.auth.getSession()` fetches current session
2. **Auth state changes** → `supabase.auth.onAuthStateChange()` listener updates React state
3. **User attempts protected route** → `ProtectedRoute` component redirects to `/login` if no session
4. **Logged-in users** → Auto-redirected away from `/login` and `/signup` to `/`

## Signup → Confirmation Email

- User signs up with email + password
- Supabase sends confirmation email
- User must click link in email to activate account
- After confirmation, user can log in

**Note:** Email confirmation is **required** — unconfirmed users cannot log in (Supabase default setting).

## Session Persistence

Session data is stored in browser localStorage by the Supabase client. On reload:

- Page shows `null` briefly while fetching session
- If session exists, user stays logged in
- Can implement a loading spinner if needed

## Future Extensions

- Multi-factor authentication
- OAuth integrations (Google, GitHub)
- Password reset flow
- Profile management
- Session revocation/logout on all devices
