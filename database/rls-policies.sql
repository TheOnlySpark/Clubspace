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
language plpgsql
security definer
set search_path = public
as $$
declare
  uni_id uuid;
begin
  select university_id into uni_id from profiles where id = auth.uid();
  return uni_id;
end;
$$;

-- Enable Row Level Security on all tables
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
language plpgsql
security definer
set search_path = public
as $$
begin
  return query select club_id from club_memberships where user_id = auth.uid();
end;
$$;

create or replace function public.get_user_admin_clubs()
returns setof uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  return query select club_id from club_memberships where user_id = auth.uid() and role in ('admin', 'officer');
end;
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
  using (club_id in (select public.get_user_admin_clubs()));

create policy "memberships_delete" on club_memberships for delete
  using (user_id = auth.uid() OR club_id in (select public.get_user_admin_clubs()));

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

-- Announcements (v2)
alter table announcement_reads enable row level security;
alter table announcement_audit_log enable row level security;
alter table announcement_settings enable row level security;

-- Helper: get user's role string
create or replace function public.get_user_role()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  r text;
begin
  select role into r 
  from user_roles 
  where user_id = auth.uid() 
  order by 
    case role
      when 'super_admin' then 1
      when 'university_admin' then 2
      when 'club_admin' then 3
      when 'officer' then 4
      else 5
    end asc,
    created_at desc 
  limit 1;
  return coalesce(r, 'member');
end;
$$;

-- Select: published within scope
create policy "announcements_select_published" on announcements for select
  using (
    status = 'published'
    and (
      visibility = 'public'
      or (visibility = 'university' and university_id = public.get_user_university_id())
      or (visibility = 'club' and club_id in (select public.get_user_clubs()))
    )
  );

-- Select: own drafts/rejected
create policy "announcements_select_own" on announcements for select
  using (
    author_id = auth.uid()
    and status in ('draft', 'pending_approval', 'rejected')
  );

-- Select: pending approval (for club admins+ of that club)
create policy "announcements_select_pending" on announcements for select
  using (
    status = 'pending_approval'
    and (
      club_id in (select club_id from club_memberships where user_id = auth.uid() and role = 'admin')
      or public.get_user_role() in ('university_admin', 'super_admin')
    )
  );

-- Insert: role-gated visibility and status enforcement
create policy "announcements_insert" on announcements for insert
  with check (
    author_id = auth.uid()
    and (
      (visibility = 'club' and club_id is not null)
      or
      (visibility = 'university' and public.get_user_role() in ('university_admin', 'super_admin'))
      or 
      (visibility = 'public' and public.get_user_role() in ('university_admin', 'super_admin'))
    )
    and status in ('draft', 'pending_approval', 'published')
  );

-- Update: authors can edit drafts, admins can approve/reject
create policy "announcements_update" on announcements for update
  using (
    author_id = auth.uid()
    or club_id in (select club_id from club_memberships where user_id = auth.uid() and role = 'admin')
    or public.get_user_role() in ('university_admin', 'super_admin')
  );

-- Delete: club admin (own club), university admin, super admin
create policy "announcements_delete" on announcements for delete
  using (
    club_id in (select club_id from club_memberships where user_id = auth.uid() and role = 'admin')
    or public.get_user_role() in ('university_admin', 'super_admin')
  );

-- Announcement Reads
create policy "reads_select" on announcement_reads for select
  using (user_id = auth.uid());

create policy "reads_insert" on announcement_reads for insert
  with check (user_id = auth.uid());

-- Announcement Audit Log
create policy "audit_insert" on announcement_audit_log for insert
  with check (actor_id = auth.uid());

create policy "audit_select" on announcement_audit_log for select
  using (
    actor_id = auth.uid()
    or public.get_user_role() in ('club_admin', 'university_admin', 'super_admin')
  );

-- Announcement Settings
create policy "settings_select" on announcement_settings for select
  using (university_id = public.get_user_university_id());

create policy "settings_update" on announcement_settings for update
  using (
    university_id = public.get_user_university_id()
    and public.get_user_role() in ('university_admin', 'super_admin')
  );

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