-- Drop existing policies to ensure clean state
drop policy if exists "profiles_select" on profiles;
drop policy if exists "profiles_update" on profiles;
drop policy if exists "clubs_select" on clubs;
drop policy if exists "memberships_select" on club_memberships;
drop policy if exists "events_select" on events;
drop policy if exists "notifications_select" on notifications;
drop policy if exists "notifications_update" on notifications;
drop policy if exists "gdpr_select" on gdpr_requests;

-- Enable RLS on all tables
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

-- 1. Security Definer Function to avoid infinite recursion
create or replace function public.get_user_university_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select university_id from profiles where id = auth.uid();
$$;

-- Universities
create policy "universities_select" on universities for select
  using (true);

-- Departments
create policy "departments_select" on departments for select
  using (true);

-- User Roles
create policy "user_roles_select" on user_roles for select
  using (user_id = auth.uid());

-- Profiles
create policy "profiles_select" on profiles for select
  using (
    id = auth.uid() OR
    university_id = public.get_user_university_id()
  );

create policy "profiles_update" on profiles for update
  using (id = auth.uid());

-- Clubs
create policy "clubs_select" on clubs for select
  using (university_id = public.get_user_university_id());

create policy "clubs_insert" on clubs for insert
  with check (university_id = public.get_user_university_id());

create policy "clubs_update" on clubs for update
  using (id in (
    select club_id from club_memberships 
    where user_id = auth.uid() and role in ('admin', 'officer')
  ));

create policy "clubs_delete" on clubs for delete
  using (id in (
    select club_id from club_memberships 
    where user_id = auth.uid() and role = 'admin'
  ));

create or replace function public.get_user_clubs()
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select club_id from club_memberships where user_id = auth.uid();
$$;

-- Club Memberships
create policy "memberships_select" on club_memberships for select
  using (
    user_id = auth.uid() OR
    club_id in (select public.get_user_clubs())
  );

create policy "memberships_insert" on club_memberships for insert
  with check (user_id = auth.uid());

create policy "memberships_update" on club_memberships for update
  using (club_id in (select club_id from club_memberships where user_id = auth.uid() and role in ('admin', 'officer')));

create policy "memberships_delete" on club_memberships for delete
  using (user_id = auth.uid() OR club_id in (select club_id from club_memberships where user_id = auth.uid() and role in ('admin', 'officer')));

-- Events
create policy "events_select" on events for select
  using (club_id in (select id from clubs where university_id = public.get_user_university_id()));

create policy "events_insert" on events for insert
  with check (club_id in (select club_id from club_memberships where user_id = auth.uid() and role in ('admin', 'officer')));

create policy "events_update" on events for update
  using (club_id in (select club_id from club_memberships where user_id = auth.uid() and role in ('admin', 'officer')));

create policy "events_delete" on events for delete
  using (club_id in (select club_id from club_memberships where user_id = auth.uid() and role in ('admin', 'officer')));

-- Event Attendance
create policy "attendance_select" on event_attendance for select
  using (user_id = auth.uid() OR event_id in (
    select id from events where club_id in (
      select club_id from club_memberships where user_id = auth.uid() and role in ('admin', 'officer')
    )
  ));

create policy "attendance_insert" on event_attendance for insert
  with check (user_id = auth.uid());

-- Announcements
create policy "announcements_select" on announcements for select
  using (club_id in (select club_id from club_memberships where user_id = auth.uid()));

create policy "announcements_insert" on announcements for insert
  with check (club_id in (select club_id from club_memberships where user_id = auth.uid() and role in ('admin', 'officer')));

-- Notifications
create policy "notifications_select" on notifications for select
  using (user_id = auth.uid());

create policy "notifications_update" on notifications for update
  using (user_id = auth.uid());

create policy "notifications_delete" on notifications for delete
  using (user_id = auth.uid());

-- Invite Links
create policy "invites_select" on invite_links for select
  using (club_id in (select club_id from club_memberships where user_id = auth.uid() and role in ('admin', 'officer')));

create policy "invites_insert" on invite_links for insert
  with check (club_id in (select club_id from club_memberships where user_id = auth.uid() and role in ('admin', 'officer')));

create policy "invites_update" on invite_links for update
  using (club_id in (select club_id from club_memberships where user_id = auth.uid() and role in ('admin', 'officer')));

create policy "invites_delete" on invite_links for delete
  using (club_id in (select club_id from club_memberships where user_id = auth.uid() and role in ('admin', 'officer')));

-- CSV Imports
create policy "imports_select" on csv_imports for select
  using (university_id = public.get_user_university_id());

create policy "imports_insert" on csv_imports for insert
  with check (university_id = public.get_user_university_id());

-- GDPR Requests
create policy "gdpr_select" on gdpr_requests for select
  using (user_id = auth.uid());

create policy "gdpr_insert" on gdpr_requests for insert
  with check (user_id = auth.uid());