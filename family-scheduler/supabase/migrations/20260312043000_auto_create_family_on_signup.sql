begin;

-- Auto-create a default family row whenever a new user signs up.
-- Uses SECURITY DEFINER so it runs as postgres, bypassing RLS.
-- This fires whether or not the user has confirmed their email,
-- making it the reliable path when email confirmation is enabled.

create or replace function public.handle_new_user_family()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.families (name, created_by)
  values ('My Family', new.id);
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user_family();

commit;
