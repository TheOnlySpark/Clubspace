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

create table events (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references clubs(id) on delete cascade,
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity integer,
  status text default 'draft' check (status in ('draft','published','cancelled')),
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table event_attendance (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  marked_at timestamptz default now(),
  unique(event_id, user_id)
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
create index on events(club_id);
create index on events(starts_at);
create index on notifications(user_id);
create index on notifications(read);
create index on invite_links(token);
create index on invite_links(club_id);