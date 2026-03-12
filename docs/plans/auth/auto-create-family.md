# Auto-Create Family on Signup

## What Was Done

Every new user automatically gets a `families` row when they sign up.

Two complementary mechanisms ensure this works in all environments:

| Mechanism                                  | When it runs                                  | Why                                                                      |
| ------------------------------------------ | --------------------------------------------- | ------------------------------------------------------------------------ |
| **DB trigger** (`handle_new_user_family`)  | At `auth.users` INSERT, always                | Email confirmation enabled → no live session yet, so client can't insert |
| **Client-side insert** in `SignupPage.tsx` | Only when `signUp()` returns a live `session` | Email confirmation disabled (local dev) → provides immediate family row  |

The DB trigger is the primary, reliable path. The client-side insert is a belt-and-suspenders layer.

## Key Files

- **Migration:** `supabase/migrations/20260312043000_auto_create_family_on_signup.sql`
- **Client code:** `src/pages/SignupPage.tsx` — `handleSubmit()`

## DB Trigger Details

```sql
-- Runs as postgres (SECURITY DEFINER), bypasses RLS
create function public.handle_new_user_family()
  returns trigger language plpgsql security definer ...

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user_family();
```

`SECURITY DEFINER` is what makes this work regardless of the session state — the insert runs as the database owner, not the calling user.

## Why Not Client-Side Only?

The `families` table has RLS: `created_by = auth.uid()`.

When **email confirmation is enabled** (production), `signUp()` returns `session: null` — the user has no active session until they click the confirmation link. Any client-side insert at that point fails silently because `auth.uid()` is `null`.

## Default Family Name

Family is created with `name = 'My Family'`. Users can rename it later from their profile/settings page (not yet built).

To personalize at signup, update the trigger to use `new.raw_user_meta_data->>'full_name'`:

```sql
insert into public.families (name, created_by)
values (
  coalesce(new.raw_user_meta_data->>'full_name' || '''s Family', 'My Family'),
  new.id
);
```

## Testing

### Verify trigger works:

1. Sign up a new user
2. Check Supabase dashboard → Table Editor → `families`
3. A row should appear with `created_by = <new user id>`

### Verify in SQL:

```sql
select f.name, f.created_by, u.email
from families f
join auth.users u on u.id = f.created_by
order by f.created_at desc;
```

## Gotchas

- **Duplicate families**: If you somehow run the client-side insert AND the trigger for the same user, you'll get two family rows. The trigger always fires; the client-side insert is guarded by `if (data.session)` to prevent this in production (where email confirm is on).
- **Applying to existing users**: The trigger only fires for new signups. Pre-existing users without a family row need a one-time backfill:
  ```sql
  insert into families (name, created_by)
  select 'My Family', id from auth.users
  where id not in (select created_by from families);
  ```
- **Re-running migration locally**: `supabase db reset` drops all data; re-signup will create fresh family rows.
