create table universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  domain_allowlist text[] not null default '{}',
  settings jsonb default '{}',
  created_at timestamptz default now()
);

create table departments (
  id uuid primary key default gen_random_uuid(),
  university_id uuid references universities(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  university_id uuid references universities(id) on delete cascade,
  role text not null check (role in ('super_admin','university_admin','club_admin','officer','member')),
  created_at timestamptz default now(),
  unique(user_id, university_id)
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  university_id uuid references universities(id),
  first_name text,
  last_name text,
  student_number text,
  department_id uuid references departments(id),
  avatar_url text,
  active boolean default true,
  created_at timestamptz default now()
);

create table clubs (
  id uuid primary key default gen_random_uuid(),
  university_id uuid references universities(id) on delete cascade,
  department_id uuid references departments(id),
  name text not null,
  slug text unique not null,
  description text,
  banner_url text,
  privacy text default 'university' check (privacy in ('public','university','members')),
  join_policy text default 'invite' check (join_policy in ('open','invite','approval')),
  settings jsonb default '{}',
  created_at timestamptz default now()
);

create table club_memberships (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references clubs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'member' check (role in ('admin','officer','member')),
  joined_at timestamptz default now(),
  unique(club_id, user_id)
);


create table announcements (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references clubs(id) on delete cascade,
  title text not null,
  body text not null,
  sent_by uuid references auth.users(id),
  sent_at timestamptz default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  announcement_id uuid references announcements(id) on delete cascade,
  read boolean default false,
  created_at timestamptz default now()
);

create table invite_links (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references clubs(id) on delete cascade,
  token text unique not null,
  expires_at timestamptz,
  max_uses integer,
  use_count integer default 0,
  revoked boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table csv_imports (
  id uuid primary key default gen_random_uuid(),
  university_id uuid references universities(id) on delete cascade,
  uploaded_by uuid references auth.users(id),
  status text default 'pending' check (status in ('pending','processing','complete','failed')),
  report jsonb default '{}',
  created_at timestamptz default now()
);

create table gdpr_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text check (type in ('export','erasure')),
  status text default 'pending' check (status in ('pending','processing','complete')),
  created_at timestamptz default now(),
  completed_at timestamptz
);

create index on profiles(university_id);
create index on clubs(university_id);
create index on club_memberships(club_id);
create index on club_memberships(user_id);
create index on notifications(user_id);
create index on notifications(read);
create index on invite_links(token);
create index on invite_links(club_id);
-- Migration: Announcement Module v2
-- Drops old barebones announcements + notifications tables and recreates per spec.

-- 1. Drop old tables (order matters due to FK constraints)
drop table if exists notifications cascade;
drop table if exists announcements cascade;

-- 2. Core announcements table
create table announcements (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references universities(id),
  club_id uuid references clubs(id),          -- null = university-wide
  author_id uuid not null references profiles(id),
  title text not null check (char_length(title) between 1 and 150),
  body text not null check (char_length(body) <= 5000),
  status text not null default 'draft'
    check (status in ('draft','pending_approval','published','archived','rejected')),
  visibility text not null default 'club'
    check (visibility in ('club','university','public')),
  pinned boolean not null default false,
  publish_at timestamptz,
  expires_at timestamptz,
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Read receipts / dismissals
create table announcement_reads (
  announcement_id uuid references announcements(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (announcement_id, user_id)
);

-- 4. Audit trail (append-only)
create table announcement_audit_log (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid references announcements(id) on delete cascade,
  actor_id uuid references profiles(id),
  action text not null,   -- created, edited, submitted, approved, rejected, published, archived, deleted
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- 5. Per-institution settings
create table announcement_settings (
  university_id uuid primary key references universities(id),
  require_approval_for_officers boolean not null default true,
  max_pinned_per_club int not null default 1,
  allow_club_public_visibility boolean not null default false,
  retention_days int not null default 365,
  branding_color text default '#2563EB',
  updated_at timestamptz not null default now()
);

-- 6. Indexes
create index idx_announcements_club on announcements(club_id, status);
create index idx_announcements_university on announcements(university_id, status);
create index idx_announcements_publish on announcements(publish_at) where status = 'pending_approval';
create index idx_announcements_author on announcements(author_id);
create index idx_announcement_reads_user on announcement_reads(user_id);

-- 7. Auto-update updated_at trigger
create or replace function update_announcements_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger announcements_updated_at
  before update on announcements
  for each row execute function update_announcements_updated_at();
-- Fix for non-deterministic role ordering
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
-- Fix announcements insert policy
drop policy if exists "announcements_insert" on announcements;

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
-- Fix: Apply all Announcement RLS Policies
alter table announcements enable row level security;
alter table announcement_reads enable row level security;
alter table announcement_audit_log enable row level security;
alter table announcement_settings enable row level security;

drop policy if exists "announcements_select_published" on announcements;
drop policy if exists "announcements_select_own" on announcements;
drop policy if exists "announcements_select_pending" on announcements;
drop policy if exists "announcements_insert" on announcements;
drop policy if exists "announcements_update" on announcements;
drop policy if exists "announcements_delete" on announcements;

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
-- Fix: Enforce Strict RLS on all remaining tables
alter table universities enable row level security;
alter table departments enable row level security;
alter table user_roles enable row level security;
alter table profiles enable row level security;
alter table clubs enable row level security;
alter table club_memberships enable row level security;
alter table invite_links enable row level security;
alter table csv_imports enable row level security;
alter table gdpr_requests enable row level security;
alter table notifications enable row level security;

-- Profiles: Users can see profiles in their university, and update their own.
drop policy if exists "profiles_select" on profiles;
create policy "profiles_select" on profiles for select using (
  university_id = public.get_user_university_id()
);

drop policy if exists "profiles_update" on profiles;
create policy "profiles_update" on profiles for update using (
  id = auth.uid()
);

-- Clubs: Users can see clubs in their university.
drop policy if exists "clubs_select" on clubs;
create policy "clubs_select" on clubs for select using (
  university_id = public.get_user_university_id()
);
-- Inserts and Updates restricted to admins/superadmins (usually handled via adminClient anyway, but backstop)
drop policy if exists "clubs_insert" on clubs;
create policy "clubs_insert" on clubs for insert with check (
  public.get_user_role() in ('university_admin', 'super_admin')
);

drop policy if exists "clubs_update" on clubs;
create policy "clubs_update" on clubs for update using (
  public.get_user_role() in ('university_admin', 'super_admin')
);

-- Club Memberships: Users can see memberships for clubs in their university
drop policy if exists "club_memberships_select" on club_memberships;
create policy "club_memberships_select" on club_memberships for select using (
  club_id in (select id from clubs where university_id = public.get_user_university_id())
);

-- Fix announcements insert policy (prevent members from publishing)
drop policy if exists "announcements_insert" on announcements;
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
    and (
      -- Draft and pending_approval can be inserted by anyone (subject to visibility above)
      status in ('draft', 'pending_approval')
      or
      -- Published can only be inserted by officers or admins
      (
        status = 'published'
        and (
          public.get_user_role() in ('university_admin', 'super_admin')
          or
          (club_id is not null and club_id in (
            select club_id from club_memberships where user_id = auth.uid() and role in ('admin', 'officer')
          ))
        )
      )
    )
  );

-- Enable RLS on all tables
alter table universities enable row level security;
alter table departments enable row level security;
alter table user_roles enable row level security;
alter table profiles enable row level security;
alter table clubs enable row level security;
alter table club_memberships enable row level security;
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

create policy "memberships_update" on club_memberships for update
  using (club_id in (select public.get_user_admin_clubs()));

create policy "memberships_delete" on club_memberships for delete
  using (user_id = auth.uid() OR club_id in (select public.get_user_admin_clubs()));

  with check (club_id in (select club_id from club_memberships where user_id = auth.uid() and role in ('admin', 'officer')));

  using (club_id in (select club_id from club_memberships where user_id = auth.uid() and role in ('admin', 'officer')));

  using (club_id in (select club_id from club_memberships where user_id = auth.uid() and role in ('admin', 'officer')));

      select club_id from club_memberships where user_id = auth.uid() and role in ('admin', 'officer')
    )
  ));


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
-- Create the public buckets
insert into storage.buckets (id, name, public)
values 
  ('avatars', 'avatars', true),
  ('club-banners', 'club-banners', true)
on conflict (id) do nothing;

-- Set up RLS for storage.objects if not already enabled
alter table storage.objects enable row level security;

-- 1. "Anyone can read public files"
create policy "Public Access to avatars" 
  on storage.objects for select 
  using ( bucket_id = 'avatars' );

create policy "Public Access to club banners" 
  on storage.objects for select 
  using ( bucket_id = 'club-banners' );

-- 2. "Authenticated users can upload to their own folder"
-- This uses the standard Supabase pattern where a user's files are stored in a folder matching their user ID.
create policy "Users can upload avatars to own folder"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

create policy "Users can update avatars in own folder"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

create policy "Users can delete avatars in own folder"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

-- Do the same for club-banners (assuming the same "own folder" structure, or you can loosen this later for club admins)
create policy "Users can upload club banners to own folder"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'club-banners' AND auth.uid()::text = (storage.foldername(name))[1] );

create policy "Users can update club banners in own folder"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'club-banners' AND auth.uid()::text = (storage.foldername(name))[1] );

create policy "Users can delete club banners in own folder"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'club-banners' AND auth.uid()::text = (storage.foldername(name))[1] );
-- ClubSpace v1 Seed Script

-- ==============================================================================
-- PART 1: Run this FIRST before trying to sign up in the app
-- ==============================================================================
-- This creates a default university so your registration doesn't fail with
-- "Email domain not allowed for any university" when signing up with a gmail.com account.
INSERT INTO universities (name, slug, domain_allowlist)
SELECT 'Test University', 'test-university', ARRAY['gmail.com']
WHERE NOT EXISTS (
    SELECT 1 FROM universities WHERE 'gmail.com' = ANY(domain_allowlist)
);

-- ==============================================================================
-- PART 2: Run this AFTER you have signed up in the app with you@gmail.com
-- ==============================================================================
DO $$
DECLARE
  target_email text := 'you@gmail.com'; 
  target_user_id uuid;
BEGIN
  -- Find the user ID from the auth.users table
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;
  
  -- If the user doesn't exist yet, stop execution
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found. Please sign up first.', target_email;
  END IF;

  -- Promote the user to super_admin if they don't already have the role
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = target_user_id AND role = 'super_admin') THEN
    INSERT INTO user_roles (id, user_id, role)
    VALUES (gen_random_uuid(), target_user_id, 'super_admin');
  END IF;

END $$;
