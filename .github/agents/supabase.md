# Supabase Guidelines

## ⚠️ Critical Rules

1. **NEVER interact with a remote database** - All development uses local Supabase only
2. **NEVER run `supabase db reset`** - This is forbidden and will cause data loss
3. **Do NOT push migrations to remote** - CI/CD handles staging/production
4. **NEVER** run migrations yourself, using `supabase migration up` or any other way, locally or in production. Locally, the developers should apply migrations to their local database and may want to edit files before running. In production, the CI/CD pipeline applies migrations automatically.

## Migrations

Create new migrations with:

```bash
supabase migration new <migration_name>
```

Apply to local database only. The migration file goes in `supabase/migrations/`.

You _may_ suggest, or document, that should be run `supabase migration up` locally to apply migrations created during your work.

## RLS Policies

Follow existing patterns in other tables:

- Authenticated access patterns for user data
- Public access patterns where appropriate
- Check existing migrations for examples

## Data Model Code

Keep Supabase queries and data model interactions in `src/lib/types/` files, co-located with their Zod schemas.

## Client

Import from `src/lib/supabaseClient.ts`:

```typescript
import { supabase } from "@/lib/supabaseClient"
```
