# Campus Crew v1 Development Roadmap

Based on the Campus Crew v1 build prompt, here is the detailed, step-by-step roadmap for building the application.

## Pre-requisite: Environment Setup
- [ ] **Create `.env.local` file**
  - **ACTION REQUIRED:** You need to create an `.env.local` file in your `frontend/` directory and fill in the following placeholders with your actual keys from Supabase and your project setup:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=<YOUR_SUPABASE_PROJECT_URL>
    NEXT_PUBLIC_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
    SUPABASE_SERVICE_ROLE_KEY=<YOUR_SUPABASE_SERVICE_ROLE_KEY>
    NEXT_PUBLIC_APP_URL=<YOUR_APP_URL_E.G._http://localhost:3000>
    SUPER_ADMIN_EMAIL=<YOUR_SUPER_ADMIN_EMAIL_ADDRESS>
    ```

## Phase 1: Project & Database Foundation
- [x] **Step 1: Project Setup**
  - Initialize Next.js 14 project in `frontend/` (TypeScript, Tailwind v4).
  - Configure `postcss.config.js`, `next.config.mjs`, `tsconfig.json`, `globals.css`.
  - Setup `.env.example` (with empty keys) and `.gitignore`.
- [x] **Step 2: Database Files**
  - Create `database/migrations/001_initial_schema.sql` (Universities, profiles, clubs, events, etc.).
  - Create `database/rls-policies.sql` (Row Level Security for all tables).
  - Create `database/seed.sql`.
- [x] **Step 3: Supabase Clients & Helpers**
  - Implement `src/lib/supabase/client.ts`, `server.ts`, and `admin.ts`.
  - Create API helpers (`requireAuth`, `requireRole`) in `api-helpers.ts` and utility functions in `utils.ts`.
  - Setup Zod validations (`auth.ts`, `clubs.ts`, `events.ts`, `members.ts`, `announcements.ts`).
- [x] **Step 4: TypeScript Types**
  - Define all database entities and roles in `src/types/index.ts`.

## Phase 2: Core UI & Layouts
- [x] **Step 5: UI Components**
  - Build base UI components in `src/components/ui/`: Button, Input, Modal, Badge, Table, Toast, Dropdown.
- [x] **Step 6: Layout Components**
  - Build `Sidebar.tsx` (role-aware navigation).
  - Build `Navbar.tsx`, `NotificationBell.tsx` (polling), `PageHeader.tsx` in `src/components/layout/`.
- [x] **Step 9: Dashboard Layout & Home**
  - Implement `src/app/dashboard/layout.tsx` (server-side auth guard).
  - Create `src/app/dashboard/page.tsx` (overview metrics).

## Phase 3: Authentication & Authorization
- [x] **Step 7: Auth Pages & Components**
  - Build auth pages: Login, Register (domain allowlist), Verify, Forgot/Reset Password.
  - Build forms in `src/components/auth/`: `LoginForm`, `RegisterForm`, `CookieConsent`.
- [x] **Step 8: Auth API Routes**
  - Implement `src/app/api/auth/register/route.ts` (domain check, Supabase user creation, Member role assignment).
  - Implement `src/app/api/auth/logout/route.ts`.
- [x] **Step 10: Hooks**
  - Develop `useAuth.ts`, `useRole.ts`, `useClub.ts`, `useNotifications.ts` in `src/hooks/`.

## Phase 4: Feature Modules
- [x] **Step 11: Members Module**
  - Components: `MemberTable`, `RoleSelector`, `RemoveMemberModal`.
  - Pages & API: `dashboard/members/page.tsx`, `/api/clubs/[id]/members/[uid]/route.ts`.
- [ ] **Step 12: Events Module**
  - Components: `EventCard`, `EventForm`, `AttendanceTable`, `GoogleCalendarButton`.
  - Pages & API: `dashboard/events/page.tsx`, `events/[id]/page.tsx` (public), event API routses.
- [x] **Step 13: Announcements & Notifications**
  - Components: `AnnouncementForm`, `AnnouncementList`, `NotificationInbox`.
  - Pages & API: `dashboard/announcements/page.tsx`, notification API routes.
- [x] **Step 14: Club Settings & Invite Links**
  - Components: `InviteGenerator`, `InviteTable`, `InviteLinkCard`.
  - Pages & API: `dashboard/settings/page.tsx` (club profile, privacy), invite API routes.

## Phase 5: Admin & Compliance
- [ ] **Step 15: CSV Import**
  - Component: `CSVImport` (file upload, validation).
  - API: `/api/university/import/route.ts` (papaparse, create pending accounts).
- [x] **Step 16: University Admin Panel**
  - Components: `UniversitySettings`, `ClubManager`, `UserRoleTable`.
  - Pages & API: `dashboard/admin/page.tsx`, admin API routes.
- [x] **Step 17: Super Admin Panel**
  - Pages & API: `dashboard/superadmin/page.tsx`, superadmin API routes.
- [ ] **Step 18: GDPR Module**
  - API: Export user data (`/api/gdpr/export/route.ts`), Erase user data (`/api/gdpr/erase/route.ts`).
  - Pages: `privacy/page.tsx`, `terms/page.tsx`.

## Phase 6: Polish & Launch
- [ ] **Step 19: Public Pages**
  - Build public landing page (`src/app/page.tsx`) and public club page (`src/app/clubs/[slug]/page.tsx`).
- [ ] **Step 20: Security Audit**
  - Verify security headers in `next.config.mjs`.
  - Verify API routes call `requireAuth` or `requireRole`.
  - Ensure `SUPABASE_SERVICE_ROLE_KEY` is not exposed in client components.
- [ ] **Step 21: Open Source Files**
  - Add `LICENSE` (MIT), `README.md`, `CONTRIBUTING.md`.
- [ ] **Step 22: Final Build Check**
  - Run `next build` in `frontend/`, resolve all TypeScript/import/build errors.
  - Deploy to Vercel.
