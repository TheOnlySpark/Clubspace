# Campus Crew v1 — Claude Code Build Prompt

## Instructions for Claude Code

You are building **Campus Crew** from start to finish without stopping. Do not ask for confirmation between steps. Do not stop to summarise progress. Build every file, fix every error, and do not consider the task complete until the application compiles, runs, and is ready for deployment to Vercel.

Work through every step in the order listed. If you encounter an error, fix it immediately and continue. Never leave a placeholder, a TODO comment, or an empty file.

---

## What You Are Building

Campus Crew is a production-ready, open-source platform for managing university student club memberships, events, and communications. It is fully configurable from the dashboard with zero hardcoded institutional values. It is legally compliant (GDPR + POPIA), secure, MIT licensed, and built to scale across multiple universities and clubs.

---

## Project Structure

All Next.js source files live inside `frontend/src/`.

```
campus-crew/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── globals.css
│   │   │   ├── auth/
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   ├── verify-email/page.tsx
│   │   │   │   ├── forgot-password/page.tsx
│   │   │   │   └── reset-password/page.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── members/page.tsx
│   │   │   │   ├── events/page.tsx
│   │   │   │   ├── announcements/page.tsx
│   │   │   │   ├── settings/page.tsx
│   │   │   │   ├── admin/page.tsx
│   │   │   │   └── superadmin/page.tsx
│   │   │   ├── clubs/
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── events/
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── privacy/page.tsx
│   │   │   ├── terms/page.tsx
│   │   │   └── api/
│   │   │       ├── auth/
│   │   │       │   ├── register/route.ts
│   │   │       │   └── logout/route.ts
│   │   │       ├── users/
│   │   │       │   └── me/route.ts
│   │   │       ├── clubs/
│   │   │       │   ├── route.ts
│   │   │       │   └── [id]/
│   │   │       │       ├── route.ts
│   │   │       │       ├── members/[uid]/route.ts
│   │   │       │       ├── events/route.ts
│   │   │       │       ├── announcements/route.ts
│   │   │       │       └── invites/route.ts
│   │   │       ├── events/
│   │   │       │   └── [id]/
│   │   │       │       ├── route.ts
│   │   │       │       └── attendance/route.ts
│   │   │       ├── notifications/
│   │   │       │   ├── route.ts
│   │   │       │   └── read-all/route.ts
│   │   │       ├── invites/
│   │   │       │   └── [token]/route.ts
│   │   │       ├── university/
│   │   │       │   └── import/route.ts
│   │   │       ├── admin/
│   │   │       │   ├── clubs/route.ts
│   │   │       │   └── members/[uid]/route.ts
│   │   │       ├── superadmin/
│   │   │       │   ├── overview/route.ts
│   │   │       │   ├── universities/route.ts
│   │   │       │   └── users/[uid]/route.ts
│   │   │       └── gdpr/
│   │   │           ├── export/route.ts
│   │   │           └── erase/route.ts
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Table.tsx
│   │   │   │   ├── Toast.tsx
│   │   │   │   └── Dropdown.tsx
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── PageHeader.tsx
│   │   │   │   └── NotificationBell.tsx
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   └── CookieConsent.tsx
│   │   │   ├── members/
│   │   │   │   ├── MemberTable.tsx
│   │   │   │   ├── MemberCard.tsx
│   │   │   │   ├── RoleSelector.tsx
│   │   │   │   └── RemoveMemberModal.tsx
│   │   │   ├── events/
│   │   │   │   ├── EventCard.tsx
│   │   │   │   ├── EventForm.tsx
│   │   │   │   ├── AttendanceTable.tsx
│   │   │   │   └── GoogleCalendarButton.tsx
│   │   │   ├── announcements/
│   │   │   │   ├── AnnouncementForm.tsx
│   │   │   │   ├── AnnouncementList.tsx
│   │   │   │   └── NotificationInbox.tsx
│   │   │   ├── invites/
│   │   │   │   ├── InviteLinkCard.tsx
│   │   │   │   ├── InviteGenerator.tsx
│   │   │   │   └── InviteTable.tsx
│   │   │   └── admin/
│   │   │       ├── UniversitySettings.tsx
│   │   │       ├── ClubManager.tsx
│   │   │       ├── UserRoleTable.tsx
│   │   │       └── CSVImport.tsx
│   │   ├── lib/
│   │   │   ├── supabase/
│   │   │   │   ├── client.ts
│   │   │   │   ├── server.ts
│   │   │   │   └── admin.ts
│   │   │   ├── validations/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── clubs.ts
│   │   │   │   ├── events.ts
│   │   │   │   ├── members.ts
│   │   │   │   └── announcements.ts
│   │   │   ├── api-helpers.ts
│   │   │   └── utils.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useRole.ts
│   │   │   ├── useClub.ts
│   │   │   └── useNotifications.ts
│   │   └── types/
│   │       └── index.ts
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── tsconfig.json
│   └── package.json
├── database/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   ├── rls-policies.sql
│   └── seed.sql
├── .env.example
├── .gitignore
├── LICENSE
├── README.md
└── CONTRIBUTING.md
```

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14, TypeScript strict, Tailwind CSS v4 |
| Database | Supabase (PostgreSQL 16 with RLS) |
| Auth | Supabase Auth (email + password) |
| Storage | Supabase Storage (avatars, club banners) |
| Backend | Next.js API Routes |
| Validation | Zod |
| Hosting | Vercel |
| Email | Supabase Auth (verification + password reset only) |
| License | MIT |

---

## Critical Rules — Apply Everywhere

- Every file that uses useState, useEffect, useRouter, or any React hook must have "use client" as its absolute first line
- All source files live inside frontend/src/ — never outside it
- Use next.config.mjs not next.config.ts — Next.js 14 does not support .ts config files
- next.config.mjs must use ESM format: export default nextConfig
- postcss.config.js must use @tailwindcss/postcss not tailwindcss directly
- TypeScript strict mode — no any, no unchecked nulls
- Zod validation on every API route and every form
- Every async function wrapped in try/catch — never leak errors to the client
- No hardcoded university names, domains, or institutional values anywhere
- SUPABASE_SERVICE_ROLE_KEY only ever used in server-side API routes — never in client components
- tsconfig.json paths alias @/* must point to frontend/src/*

---

## Config Files (use exactly as written)

### postcss.config.js
```js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

### next.config.mjs
```mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'",
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "es2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### globals.css
```css
@import "tailwindcss";

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', sans-serif;
  background-color: #ffffff;
  color: #0F1B2D;
}
```

---

## Package Dependencies

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2",
    "@supabase/ssr": "^0",
    "next": "14",
    "react": "^18",
    "react-dom": "^18",
    "zod": "^3",
    "papaparse": "^5"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/papaparse": "^5",
    "autoprefixer": "^10",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
SUPER_ADMIN_EMAIL=
```

---

## Role Hierarchy

```
Super Admin
  └── University Admin
        └── Club Admin
              └── Officer
                    └── Member
```

- New signups always receive Member role — no exceptions
- Only University Admin or Super Admin can elevate a user's role
- No self-elevation at any layer — enforce in API middleware and RLS
- Store roles in user_roles table — not in Supabase Auth metadata

---

## Member Onboarding — Three Gates (all required)

### 1. University Email Domain Allowlist
- Each university configures allowed domains (e.g. @uct.ac.za) from the dashboard
- /api/auth/register rejects emails not matching the allowlist at the API level
- Configurable by University Admin — no code changes required

### 2. Club Invite Links
- Club Admins generate unique invite links with expiry, max uses, and revoke controls
- Valid link — user registers — auto-joined to club as Member
- Expired or revoked links return a clear error — never silently fail

### 3. CSV Bulk Import
- University Admin uploads CSV from the dashboard
- Required columns: email, student_number
- Optional columns: first_name, last_name, department
- System creates pending accounts and sends setup emails via Supabase Auth
- Duplicates skipped, full import report returned to admin
- All imported students get Member role only

### CSV Template
```csv
first_name,last_name,email,student_number,department
John,Doe,john.doe@uct.ac.za,DCXJOH001,Computer Science
```

### Member Removal
- Entirely through the UI — no direct database access needed
- Club Admin removes members from their club only
- University Admin removes or deactivates any member in their university
- Super Admin can remove anyone
- Removing from a club revokes access but keeps account active
- GDPR erasure anonymises PII then hard deletes after 30 days

---

## Database Schema

```sql
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
```

---

## RLS Policies

```sql
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
```

---

## Supabase Clients

```typescript
// src/lib/supabase/client.ts
"use client"
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }) },
        remove(name: string, options: any) { cookieStore.set({ name, value: '', ...options }) },
      },
    }
  )
}
```

```typescript
// src/lib/supabase/admin.ts
// NEVER import this file in any client component
import { createClient } from '@supabase/supabase-js'
export const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

---

## API Middleware

```typescript
// src/lib/api-helpers.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ROLE_HIERARCHY = ['member','officer','club_admin','university_admin','super_admin']

export async function requireAuth() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: NextResponse.json({ error: 'Unauthorised' }, { status: 401 }) }
  return { session, supabase }
}

export async function requireRole(minRole: string) {
  const auth = await requireAuth()
  if ('error' in auth) return auth
  const { data: roleData } = await auth.supabase
    .from('user_roles').select('role').eq('user_id', auth.session.user.id).single()
  if (!roleData || ROLE_HIERARCHY.indexOf(roleData.role) < ROLE_HIERARCHY.indexOf(minRole)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { session: auth.session, supabase: auth.supabase, role: roleData.role }
}
```

---

## Google Calendar Button

```typescript
// src/components/events/GoogleCalendarButton.tsx
"use client"
export function buildGoogleCalendarUrl(event: {
  title: string; description?: string; location?: string; starts_at: string; ends_at: string
}) {
  const fmt = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const params = new URLSearchParams({
    action: 'TEMPLATE', text: event.title,
    dates: `${fmt(event.starts_at)}/${fmt(event.ends_at)}`,
    details: event.description ?? '', location: event.location ?? '',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export default function GoogleCalendarButton({ event }: { event: any }) {
  return (
    <a href={buildGoogleCalendarUrl(event)} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
      Add to Google Calendar
    </a>
  )
}
```

---

## Design System

- Primary: #0F1B2D (deep navy)
- Accent: #2563EB (electric blue)
- Muted: #64748B (slate)
- Success: #16A34A (green)
- Danger: #DC2626 (red)
- Background: #FFFFFF (white)
- Font: Inter (Google Fonts)
- All components built with Tailwind — no external component libraries
- All interactive elements must have visible focus states and ARIA labels
- Dashboard views usable on tablet and above
- Auth pages mobile friendly

---

## Legal & Compliance

- Cookie consent banner on first visit — stores acceptance in localStorage, links to /privacy
- /privacy — full GDPR + POPIA privacy policy page
- /terms — full terms of service page
- Data export — every user can download all their data from dashboard settings
- Erasure — soft delete (anonymise PII), hard delete after 30 days
- Both triggered from the member's own settings page

---

## Build Order — Do Not Stop Until Step 22 Is Complete

### Step 1 — Project Setup
- Initialise Next.js 14 project inside frontend/ with TypeScript and Tailwind
- Use the src/ directory structure
- Install all dependencies from the package list above
- Create postcss.config.js exactly as specified above
- Create next.config.mjs exactly as specified above — never next.config.ts
- Create tsconfig.json exactly as specified above — paths must point to ./src/*
- Create src/app/globals.css exactly as specified above
- Create .env.example with all keys blank
- Create .gitignore — include .env.local, .env, node_modules, .next

### Step 2 — Database Files
- Create database/migrations/001_initial_schema.sql with the full schema above
- Create database/rls-policies.sql with all RLS policies above
- Create database/seed.sql with instructions to create the first Super Admin

### Step 3 — Supabase Clients and Helpers
- Create src/lib/supabase/client.ts
- Create src/lib/supabase/server.ts
- Create src/lib/supabase/admin.ts
- Create src/lib/api-helpers.ts with requireAuth and requireRole
- Create src/lib/utils.ts with cn(), formatDate(), generateToken()
- Create src/lib/validations/auth.ts, clubs.ts, events.ts, members.ts, announcements.ts — full Zod schemas

### Step 4 — TypeScript Types
- Create src/types/index.ts with full types for all database entities and roles

### Step 5 — UI Components
- Build all src/components/ui/: Button, Input, Modal, Badge, Table, Toast, Dropdown
- Fully typed props, ARIA labels, visible focus states on every component

### Step 6 — Layout Components
- Build Sidebar.tsx — role-aware navigation (different links per role)
- Build Navbar.tsx — top bar with notification bell and user menu
- Build NotificationBell.tsx — polls for unread count every 60 seconds
- Build PageHeader.tsx

### Step 7 — Auth Pages and Components
- Build src/app/auth/login/page.tsx
- Build src/app/auth/register/page.tsx — domain allowlist check before account creation
- Build src/app/auth/verify-email/page.tsx
- Build src/app/auth/forgot-password/page.tsx
- Build src/app/auth/reset-password/page.tsx
- Build src/components/auth/LoginForm.tsx
- Build src/components/auth/RegisterForm.tsx
- Build src/components/auth/CookieConsent.tsx — GDPR cookie banner
- Add "use client" as the first line of every auth page and every component that uses hooks

### Step 8 — Auth API Routes
- Build src/app/api/auth/register/route.ts — validate domain allowlist, create Supabase user, assign Member role, handle errors cleanly
- Build src/app/api/auth/logout/route.ts

### Step 9 — Dashboard Layout and Home
- Build src/app/dashboard/layout.tsx — server-side auth guard, redirects to /auth/login if no session, wraps content in Sidebar and Navbar
- Build src/app/dashboard/page.tsx — overview showing club count, upcoming events, member count

### Step 10 — Hooks
- Build src/hooks/useAuth.ts — current user and session
- Build src/hooks/useRole.ts — isAdmin(), isSuperAdmin(), isUniversityAdmin(), isClubAdmin()
- Build src/hooks/useClub.ts — current club context
- Build src/hooks/useNotifications.ts — unread count, fetch, mark as read

### Step 11 — Members Module
- Build src/components/members/MemberTable.tsx — searchable, sortable
- Build src/components/members/RoleSelector.tsx — University Admin only
- Build src/components/members/RemoveMemberModal.tsx — confirmation modal
- Build src/app/dashboard/members/page.tsx
- Build src/app/api/clubs/[id]/members/[uid]/route.ts — PATCH (role) and DELETE (remove)

### Step 12 — Events Module
- Build src/components/events/EventCard.tsx
- Build src/components/events/EventForm.tsx
- Build src/components/events/AttendanceTable.tsx
- Build src/components/events/GoogleCalendarButton.tsx exactly as specified above
- Build src/app/dashboard/events/page.tsx
- Build src/app/events/[id]/page.tsx — public event page with Google Calendar button
- Build all event API routes

### Step 13 — Announcements and Notifications
- Build src/components/announcements/AnnouncementForm.tsx
- Build src/components/announcements/AnnouncementList.tsx
- Build src/components/announcements/NotificationInbox.tsx
- Build src/app/dashboard/announcements/page.tsx
- Build announcement API route — on POST bulk insert one notification per club member
- Build notification API routes — GET, mark as read, mark all as read

### Step 14 — Club Settings and Invite Links
- Build src/components/invites/InviteGenerator.tsx
- Build src/components/invites/InviteTable.tsx
- Build src/components/invites/InviteLinkCard.tsx
- Build src/app/dashboard/settings/page.tsx — club profile, privacy, join policy, invite links
- Build all invite API routes

### Step 15 — CSV Import
- Build src/components/admin/CSVImport.tsx — file upload, column validation, progress indicator, report display
- Build src/app/api/university/import/route.ts — parse CSV with papaparse, validate emails against domain allowlist, create pending accounts, return full import report

### Step 16 — University Admin Panel
- Build src/components/admin/UniversitySettings.tsx — domain allowlist, university profile
- Build src/components/admin/ClubManager.tsx — create, edit, deactivate clubs
- Build src/components/admin/UserRoleTable.tsx — assign and revoke roles
- Build src/app/dashboard/admin/page.tsx
- Build all /api/admin/ routes

### Step 17 — Super Admin Panel
- Build src/app/dashboard/superadmin/page.tsx — platform-wide overview, all universities, all users
- Build all /api/superadmin/ routes using adminClient (service role key)

### Step 18 — GDPR Module
- Build src/app/api/gdpr/export/route.ts — return all user data as JSON download
- Build src/app/api/gdpr/erase/route.ts — anonymise PII, mark for hard deletion after 30 days
- Add data export and erasure request buttons to src/app/dashboard/settings/page.tsx
- Build src/app/privacy/page.tsx — full GDPR + POPIA compliant privacy policy
- Build src/app/terms/page.tsx — full terms of service

### Step 19 — Public Pages
- Build src/app/page.tsx — public landing page with Campus Crew branding, feature overview, login and register links
- Build src/app/clubs/[slug]/page.tsx — public club page showing published events and club description

### Step 20 — Security Audit
- Verify next.config.mjs has all security headers and uses ESM export default
- Verify every API route calls requireAuth or requireRole before any data operation
- Verify every file using hooks has "use client" as its first line
- Verify SUPABASE_SERVICE_ROLE_KEY is never referenced in any file inside src/components/ or any page marked "use client"
- Verify .env.local and .env are in .gitignore

### Step 21 — Open Source Files
- Create LICENSE with full MIT license text
- Create README.md with project description, feature list, local setup, Supabase setup steps, environment variable table, Deploy to Vercel button, contributing link, license badge
- Create CONTRIBUTING.md with fork instructions, branch naming conventions, PR checklist, security vulnerability disclosure process

### Step 22 — Final Build Check
- Run next build inside the frontend/ directory
- Fix every TypeScript error, import error, and build error until it compiles with zero errors and zero warnings
- The application is now ready for deployment to Vercel
