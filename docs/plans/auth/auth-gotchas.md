# Auth Implementation: Gotchas & Next Steps

## Common Mistakes to Avoid

### 1. Email Confirmation Required

**Gotcha:** Unconfirmed users cannot log in — Supabase blocks them.

**Solution:** In dev, manually confirm via dashboard. For production, configure email provider in Supabase.

### 2. Session Not Persisting Across Tabs

**Gotcha:** `onAuthStateChange` only listens to _this_ tab's auth changes.

**Solution:** Sessions are persisted in localStorage. On app init, always call `supabase.auth.getSession()` to hydrate state.

### 3. Environment Variables Not Loading

**Gotcha:** `.env.local` not read after creating file.

**Solution:** Restart dev server (`npm run dev`) after adding/changing `.env.local`.

### 4. Mixed Session State

**Gotcha:** Page renders before session is fetched, showing login screen briefly.

**Solution:** Return `null` or spinner while `loading: true` in `App.tsx`.

### 5. Accidental Redirect Loops

**Gotcha:** If redirect logic is backward, user gets stuck redirecting.

**Solution:** Test all three cases: logged out → login page, logged in → login page, logged out → protected `/`.

## Recommended Next Steps

### Phase 2: Improve Auth UX

- [ ] Add loading spinner while fetching session
- [ ] Add "Remember me" checkbox (extend session expiry)
- [ ] Add "Forgot password?" → password reset flow
- [ ] Show user name in header (extract from `session.user.user_metadata.full_name`)
- [ ] Add Google/GitHub OAuth options

### Phase 3: Extend Auth System

- [ ] Add 2FA (TOTP)
- [ ] Add session management (view/revoke active sessions)
- [ ] Add email change flow
- [ ] Add password change in profile settings
- [ ] Track login history

### Phase 4: Database Integration

- [ ] Create `profiles` table linked to `auth.users`
- [ ] Add RLS policies for profile access
- [ ] Store user preferences (timezone, theme, etc.)
- [ ] Query user's family members in dashboard

## Code Organization Tips

**Keep auth isolated:**

- All auth logic in `src/pages/LoginPage.tsx` and `src/pages/SignupPage.tsx`
- Session state managed in `App.tsx`
- Types in `src/types/auth.ts`
- Never spread auth logic across components

**Reusable form components:**
Consider extracting `LoginForm` and `SignupForm` into `src/components/` if adding OAuth or other auth methods.

**User context (optional):**
When apps grow, consider a UserContext to avoid prop drilling:

```typescript
const UserContext = createContext<Session | null>(null);
// In App: <UserContext.Provider value={session}>
// In component: const session = useContext(UserContext);
```

## Debugging Tips

### Check if user is confirmed:

```javascript
// In browser console
await supabase.auth.getUser();
// Look for email_confirmed_at field
```

### Force refresh session:

```javascript
await supabase.auth.refreshSession();
```

### Clear all auth state:

```javascript
localStorage.clear();
```

### View current session:

```javascript
const {
  data: { session },
} = await supabase.auth.getSession();
console.log(session);
```

## Performance Considerations

- **Session checks run on every mount** — this is fine for small apps but lazy-load routes if scaling
- **`onAuthStateChange` fires on redirect** — consider debouncing page redirects
- **No built-in rate limiting** — Supabase rate-limits by default; add client-side validation
