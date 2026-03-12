# Auth Setup & Testing Guide

## Prerequisites

- Supabase project created with `.env.local` populated:
  ```
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGc...
  ```
- React Router installed
- Dependencies installed: `npm install`

## Running Locally

```bash
npm run dev
```

Server runs at `http://localhost:5173`

## Testing Auth Flow

### Test 1: Sign Up

1. Go to `/signup`
2. Enter: name, email, password (min 8 chars), confirm password
3. Click **Create Account**
4. See success screen: "Check your email"
5. **Important:** Go to Supabase dashboard → Auth → Users → find user
6. Click the email → "Confirm email" button (simulates confirmation in dev)
7. User is now confirmed and can log in

### Test 2: Log In

1. Go to `/login`
2. Enter confirmed email + password
3. On success → redirected to `/` (dashboard)
4. Session persists on page reload

### Test 3: Protected Routes

1. Logged out → go to `/`
2. Auto-redirected to `/login`
3. Logged in → go to `/login` or `/signup`
4. Auto-redirected to `/`

### Test 4: Sign Out

1. On dashboard → click **Sign Out** button
2. Check localStorage cleared: DevTools → Application → Local Storage
3. Redirected to `/login`

## Email Confirmation in Development

By default, Supabase requires email confirmation. In **dev/testing**:

- Use Supabase dashboard to confirm emails manually
- Or configure Supabase project settings to disable (not recommended for production)

For production, configure a real email provider (SMTP/SendGrid/etc) in Supabase settings.

## Common Issues

| Issue                                  | Solution                                              |
| -------------------------------------- | ----------------------------------------------------- |
| Login fails with "Invalid credentials" | Check email is confirmed in Supabase dashboard        |
| Session lost on refresh                | Check browser localStorage (DevTools) for `sb-*` keys |
| Routes not redirecting                 | Verify `BrowserRouter` wraps all `<Routes>`           |
| Environment variables undefined        | Restart dev server after updating `.env.local`        |

## Debugging

Enable Supabase logging:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(url, key, {
  auth: { debug: true },
});
```

Check browser console for Supabase logs and session state.
