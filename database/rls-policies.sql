alter table universities enable row level security;
alter table departments enable row level security;
alter table user_roles enable row level security;
alter table profiles enable row level security;
alter table clubs enable row level security;
alter table club_memberships enable row level security;
alter table events enable row level security;
alter table event_attendance enable row level security;
alter table announcements enable row level security;
alter table notifications enable row level security;
alter table invite_links enable row level security;
alter table csv_imports enable row level security;
alter table gdpr_requests enable row level security;

create policy "profiles_select" on profiles for select
  using (university_id = (select university_id from profiles where id = auth.uid()));

create policy "profiles_update" on profiles for update
  using (id = auth.uid());

create policy "clubs_select" on clubs for select
  using (university_id = (select university_id from profiles where id = auth.uid()));

create policy "memberships_select" on club_memberships for select
  using (club_id in (select club_id from club_memberships where user_id = auth.uid()));

create policy "events_select" on events for select
  using (club_id in (select club_id from club_memberships where user_id = auth.uid()));

create policy "notifications_select" on notifications for select
  using (user_id = auth.uid());

create policy "notifications_update" on notifications for update
  using (user_id = auth.uid());

create policy "gdpr_select" on gdpr_requests for select
  using (user_id = auth.uid());