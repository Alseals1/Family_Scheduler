# Auth Component & API Reference

## Types (`src/types/auth.ts`)

```typescript
export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}
```

## Components

### `LoginPage`

**Path:** `src/pages/LoginPage.tsx`

Form inputs: email, password  
On submit: calls `supabase.auth.signInWithPassword()`  
On success: navigates to `/`  
On error: displays error message below form

**Props:** None (uses React Router `useNavigate`)

### `SignupPage`

**Path:** `src/pages/SignupPage.tsx`

Form inputs: fullName, email, password, confirmPassword  
Validations:

- Passwords must match
- Password must be ≥ 8 characters

On submit: calls `supabase.auth.signUp()`  
On success: shows confirmation email screen, auto-redirects to `/login` in 3s  
On error: displays error message below form

**Props:** None (uses React Router `useNavigate`)

### `ProtectedRoute`

**Path:** `src/App.tsx`

Generic wrapper for routes requiring authentication.

```typescript
<ProtectedRoute session={session}>
  <Dashboard session={session!} />
</ProtectedRoute>
```

If no session → redirects to `/login`  
If session exists → renders children

## Supabase Auth Functions Used

### Sign Up

```typescript
const { error } = await supabase.auth.signUp({
  email: string,
  password: string,
  options: {
    data: { full_name: string }, // stored in user metadata
  },
});
```

### Sign In

```typescript
const { error } = await supabase.auth.signInWithPassword({
  email: string,
  password: string,
});
```

### Get Current Session

```typescript
const {
  data: { session },
} = await supabase.auth.getSession();
// Returns: Session | null
```

### Listen for Auth Changes

```typescript
const {
  data: { subscription },
} = supabase.auth.onAuthStateChange((event, session) => {
  // event: "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED" | "USER_UPDATED"
  // session: Session | null
});
// Must unsubscribe: subscription.unsubscribe()
```

### Sign Out

```typescript
await supabase.auth.signOut();
```

## Styling

All components use **inline styles** with a consistent dark theme:

- Background: `#1e1e2e` (dark navy)
- Accent: `#6366f1` (indigo)
- Text: `#e2e8f0` (light gray)
- Error: `#f87171` (red)
- Success: `#34d399` (green)

To customize: edit the `styles` object in each component (last ~120 lines).

## Error Handling

Common Supabase auth errors:

| Error                                      | Cause                                       |
| ------------------------------------------ | ------------------------------------------- |
| `Invalid login credentials`                | Wrong email/password OR email not confirmed |
| `User already registered`                  | Email already exists                        |
| `Password should be at least 8 characters` | Password too short (enforced by Supabase)   |
| `Auth session missing`                     | Session expired or invalid                  |

All errors display in a red box below the form for user feedback.
