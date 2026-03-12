begin;

alter table families enable row level security;
alter table family_members enable row level security;
alter table calendar_connections enable row level security;
alter table events enable row level security;
alter table conflicts enable row level security;
alter table suggestions enable row level security;
alter table family_preferences enable row level security;

create policy "family_owner_only" on families
  for all using (created_by = auth.uid());

create policy "family_members_access" on family_members
  for all using (
    family_id in (select id from families where created_by = auth.uid())
  );

create policy "calendar_access" on calendar_connections
  for all using (
    family_member_id in (
      select fm.id from family_members fm
      join families f on f.id = fm.family_id
      where f.created_by = auth.uid()
    )
  );

create policy "events_access" on events
  for all using (
    calendar_connection_id in (
      select cc.id from calendar_connections cc
      join family_members fm on fm.id = cc.family_member_id
      join families f on f.id = fm.family_id
      where f.created_by = auth.uid()
    )
  );

create policy "conflicts_access" on conflicts
  for all using (
    family_id in (select id from families where created_by = auth.uid())
  );

create policy "suggestions_access" on suggestions
  for all using (
    family_id in (select id from families where created_by = auth.uid())
  );

create policy "preferences_access" on family_preferences
  for all using (
    family_id in (select id from families where created_by = auth.uid())
  );

commit;