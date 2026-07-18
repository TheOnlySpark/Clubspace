-- ==============================================================================
-- CLUBSPACE V1 DATABASE SCHEMA (Refactored)
-- ==============================================================================

-- ==============================================================================
-- 1. TABLES
-- ==============================================================================

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
  email text,
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

create table announcement_reads (
  announcement_id uuid references announcements(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (announcement_id, user_id)
);

create table announcement_audit_log (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid references announcements(id) on delete cascade,
  actor_id uuid references profiles(id),
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table announcement_settings (
  university_id uuid primary key references universities(id),
  require_approval_for_officers boolean not null default true,
  max_pinned_per_club int not null default 1,
  allow_club_public_visibility boolean not null default false,
  retention_days int not null default 365,
  branding_color text default '#2563EB',
  updated_at timestamptz not null default now()
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

-- ==============================================================================
-- 2. INDEXES
-- ==============================================================================

create index on profiles(university_id);
create index on clubs(university_id);
create index on club_memberships(club_id);
create index on club_memberships(user_id);
create index on notifications(user_id);
create index on notifications(read);
create index on invite_links(token);
create index on invite_links(club_id);

create index idx_announcements_club on announcements(club_id, status);
create index idx_announcements_university on announcements(university_id, status);
create index idx_announcements_publish on announcements(publish_at) where status = 'pending_approval';
create index idx_announcements_author on announcements(author_id);
create index idx_announcement_reads_user on announcement_reads(user_id);


-- ==============================================================================
-- 3. FUNCTIONS & TRIGGERS
-- ==============================================================================

-- 3.1 Announcements updated_at trigger
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

-- 3.2 Sync auth.users to public.profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'first_name', 
    new.raw_user_meta_data->>'last_name'
  )
  on conflict (id) do update set
    email = excluded.email,
    first_name = coalesce(public.profiles.first_name, excluded.first_name),
    last_name = coalesce(public.profiles.last_name, excluded.last_name);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3.3 Helper Functions
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


-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) ENABLEMENT
-- ==============================================================================

alter table universities enable row level security;
alter table departments enable row level security;
alter table user_roles enable row level security;
alter table profiles enable row level security;
alter table clubs enable row level security;
alter table club_memberships enable row level security;
alter table announcements enable row level security;
alter table announcement_reads enable row level security;
alter table announcement_audit_log enable row level security;
alter table announcement_settings enable row level security;
alter table notifications enable row level security;
alter table invite_links enable row level security;
alter table csv_imports enable row level security;
alter table gdpr_requests enable row level security;


-- ==============================================================================
-- 5. RLS POLICIES
-- ==============================================================================

-- Universities
create policy "universities_select" on universities for select using (true);

-- Departments
create policy "departments_select" on departments for select using (true);

-- User Roles
create policy "user_roles_select" on user_roles for select using (user_id = auth.uid());

-- Profiles
create policy "profiles_select" on profiles for select using (
  id = auth.uid() OR university_id = public.get_user_university_id()
);
create policy "profiles_update" on profiles for update using (id = auth.uid());

-- Clubs
create policy "clubs_select" on clubs for select using (
  university_id = public.get_user_university_id()
);
create policy "clubs_insert" on clubs for insert with check (
  public.get_user_role() in ('university_admin', 'super_admin')
);
create policy "clubs_update" on clubs for update using (
  public.get_user_role() in ('university_admin', 'super_admin') OR
  id in (select public.get_user_admin_clubs())
);
create policy "clubs_delete" on clubs for delete using (
  public.get_user_role() in ('super_admin') OR
  id in (select club_id from club_memberships where user_id = auth.uid() and role = 'admin')
);

-- Club Memberships
create policy "memberships_select" on club_memberships for select using (
  user_id = auth.uid() OR club_id in (select public.get_user_clubs())
);
create policy "memberships_insert" on club_memberships for insert with check (
  club_id in (select public.get_user_admin_clubs())
);
create policy "memberships_update" on club_memberships for update using (
  club_id in (select public.get_user_admin_clubs())
);
create policy "memberships_delete" on club_memberships for delete using (
  user_id = auth.uid() OR club_id in (select public.get_user_admin_clubs())
);

-- Announcements
create policy "announcements_select_published" on announcements for select using (
  status = 'published' and (
    visibility = 'public' or 
    (visibility = 'university' and university_id = public.get_user_university_id()) or 
    (visibility = 'club' and club_id in (select public.get_user_clubs()))
  )
);
create policy "announcements_select_own" on announcements for select using (
  author_id = auth.uid() and status in ('draft', 'pending_approval', 'rejected')
);
create policy "announcements_select_pending" on announcements for select using (
  status = 'pending_approval' and (
    club_id in (select club_id from club_memberships where user_id = auth.uid() and role = 'admin') or 
    public.get_user_role() in ('university_admin', 'super_admin')
  )
);
create policy "announcements_insert" on announcements for insert with check (
  author_id = auth.uid() and (
    (visibility = 'club' and club_id is not null) or
    (visibility = 'university' and public.get_user_role() in ('university_admin', 'super_admin')) or 
    (visibility = 'public' and public.get_user_role() in ('university_admin', 'super_admin'))
  ) and (
    status in ('draft', 'pending_approval') or
    (status = 'published' and (
      public.get_user_role() in ('university_admin', 'super_admin') or
      (club_id is not null and club_id in (select public.get_user_admin_clubs()))
    ))
  )
);
create policy "announcements_update" on announcements for update using (
  author_id = auth.uid() or 
  club_id in (select club_id from club_memberships where user_id = auth.uid() and role = 'admin') or 
  public.get_user_role() in ('university_admin', 'super_admin')
);
create policy "announcements_delete" on announcements for delete using (
  club_id in (select club_id from club_memberships where user_id = auth.uid() and role = 'admin') or 
  public.get_user_role() in ('university_admin', 'super_admin')
);

-- Announcement Reads
create policy "reads_select" on announcement_reads for select using (user_id = auth.uid());
create policy "reads_insert" on announcement_reads for insert with check (user_id = auth.uid());

-- Announcement Audit Log
create policy "audit_insert" on announcement_audit_log for insert with check (actor_id = auth.uid());
create policy "audit_select" on announcement_audit_log for select using (
  actor_id = auth.uid() or public.get_user_role() in ('club_admin', 'university_admin', 'super_admin')
);

-- Announcement Settings
create policy "settings_select" on announcement_settings for select using (
  university_id = public.get_user_university_id()
);
create policy "settings_update" on announcement_settings for update using (
  university_id = public.get_user_university_id() and 
  public.get_user_role() in ('university_admin', 'super_admin')
);

-- Notifications
create policy "notifications_select" on notifications for select using (user_id = auth.uid());
create policy "notifications_update" on notifications for update using (user_id = auth.uid());
create policy "notifications_insert" on notifications for insert with check (user_id = auth.uid());
create policy "notifications_delete" on notifications for delete using (user_id = auth.uid());

-- Invite Links
create policy "invites_select" on invite_links for select using (club_id in (select public.get_user_admin_clubs()));
create policy "invites_insert" on invite_links for insert with check (club_id in (select public.get_user_admin_clubs()));
create policy "invites_update" on invite_links for update using (club_id in (select public.get_user_admin_clubs()));
create policy "invites_delete" on invite_links for delete using (club_id in (select public.get_user_admin_clubs()));

-- CSV Imports
create policy "imports_select" on csv_imports for select using (university_id = public.get_user_university_id());
create policy "imports_insert" on csv_imports for insert with check (university_id = public.get_user_university_id());

-- GDPR Requests
create policy "gdpr_select" on gdpr_requests for select using (user_id = auth.uid());
create policy "gdpr_insert" on gdpr_requests for insert with check (user_id = auth.uid());

-- ==============================================================================
-- 6. STORAGE CONFIGURATION
-- ==============================================================================

insert into storage.buckets (id, name, public)
values 
  ('avatars', 'avatars', true),
  ('club-banners', 'club-banners', true)
on conflict (id) do nothing;

alter table storage.objects enable row level security;

create policy "Public Access to avatars" on storage.objects for select using ( bucket_id = 'avatars' );
create policy "Public Access to club banners" on storage.objects for select using ( bucket_id = 'club-banners' );

create policy "Users can upload avatars to own folder" on storage.objects for insert to authenticated with check ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );
create policy "Users can update avatars in own folder" on storage.objects for update to authenticated using ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );
create policy "Users can delete avatars in own folder" on storage.objects for delete to authenticated using ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

create policy "Users can upload club banners to own folder" on storage.objects for insert to authenticated with check ( bucket_id = 'club-banners' AND auth.uid()::text = (storage.foldername(name))[1] );
create policy "Users can update club banners in own folder" on storage.objects for update to authenticated using ( bucket_id = 'club-banners' AND auth.uid()::text = (storage.foldername(name))[1] );
create policy "Users can delete club banners in own folder" on storage.objects for delete to authenticated using ( bucket_id = 'club-banners' AND auth.uid()::text = (storage.foldername(name))[1] );

-- ==============================================================================
-- 7. SEED SCRIPT
-- ==============================================================================

INSERT INTO universities (name, slug, domain_allowlist)
SELECT '[YOUR_UNIVERSITY_NAME]', '[YOUR_UNIVERSITY_SLUG]', ARRAY['[YOUR_DOMAIN_HERE]']
WHERE NOT EXISTS (
    SELECT 1 FROM universities WHERE '[YOUR_DOMAIN_HERE]' = ANY(domain_allowlist)
);

DO $$
DECLARE
  -- Replace this with the email of the user you want to make a Super Admin
  target_email text := '[SUPER_ADMIN_EMAIL]'; 
  target_user_id uuid;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;
  
  IF target_user_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = target_user_id AND role = 'super_admin') THEN
      INSERT INTO user_roles (id, user_id, role)
      VALUES (gen_random_uuid(), target_user_id, 'super_admin');
    END IF;
  END IF;
END $$;
