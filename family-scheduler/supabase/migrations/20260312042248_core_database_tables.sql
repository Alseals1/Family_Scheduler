begin;

-- Family groups
create table families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Family members (mom, dad, kids)
create table family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  name text not null,
  role text check (role in ('parent', 'child')),
  color text default '#6366f1',
  created_at timestamptz default now()
);

-- Calendar connections (one per Google/Outlook account)
create table calendar_connections (
  id uuid primary key default gen_random_uuid(),
  family_member_id uuid references family_members(id) on delete cascade,
  provider text check (provider in ('google', 'outlook', 'apple')),
  calendar_name text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz default now()
);

-- Events synced from calendars
create table events (
  id uuid primary key default gen_random_uuid(),
  calendar_connection_id uuid references calendar_connections(id) on delete cascade,
  external_id text not null,
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  location text,
  description text,
  created_at timestamptz default now(),
  unique(calendar_connection_id, external_id)
);

-- Detected conflicts
create table conflicts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  event_a_id uuid references events(id) on delete cascade,
  event_b_id uuid references events(id) on delete cascade,
  conflict_type text check (conflict_type in ('hard_overlap', 'transport', 'preference')),
  severity text check (severity in ('high', 'medium', 'low')),
  resolved boolean default false,
  resolution_notes text,
  created_at timestamptz default now()
);

-- AI suggestions
create table suggestions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  content text not null,
  accepted boolean,
  created_at timestamptz default now()
);

-- Family preferences (dinner time, bedtime, etc.)
create table family_preferences (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade unique,
  dinner_time time default '18:00',
  bedtime_kids time default '20:00',
  bedtime_adults time default '22:00',
  notes text,
  updated_at timestamptz default now()
);

commit;