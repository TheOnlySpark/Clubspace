# ClubSpace System Architecture & Technical Overview

This document provides a comprehensive breakdown of the technologies, security models, APIs, and underlying architectural assets that power the ClubSpace platform behind the scenes.

## 1. Tech Stack

ClubSpace is built on a modern, strictly-typed web stack designed for scale, speed, and security.

- **Frontend Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Language:** TypeScript (Strict mode enabled)
- **Styling:** Tailwind CSS v4 + custom CSS variables (`globals.css`)
- **Database & Backend-as-a-Service:** Supabase (PostgreSQL 16)
- **Authentication:** Supabase Auth (Native JWTs)
- **Data Validation:** Zod
- **Data Fetching:** SWR & Native `fetch`
- **Hosting Target:** Vercel (Optimized for edge deployment)

## 2. Core Features

- **Hierarchical Role-Based Access Control (RBAC):** Super Admin > University Admin > Club Admin > Officer > Member.
- **Club Management:** Dynamic privacy levels, join policies (open, invite-only, approval), and customizable branding.
- **Announcement Engine:** Drafts, multi-tier approvals, pinning, read-receipts, and club/university-wide targeting.
- **Administrative Dashboards:** Dedicated panels for University-wide oversight and Super Admin platform oversight.
- **Compliance Module:** Built-in GDPR and POPIA handling (automated right-to-be-forgotten erasures, data retention windows).

## 3. Security Components

Security is baked into the foundation of ClubSpace, relying on defense-in-depth rather than just front-end checks.

- **Row Level Security (RLS):** The absolute source of truth. Every database table enforces strict Postgres RLS policies based on the user's JWT payload and role. Even if the frontend UI makes a mistake, the database physically blocks unauthorized data access.
- **Native JWT Session Management:** Authentication relies on industry-standard JSON Web Tokens managed natively by Supabase. Tokens are securely passed and verified on every database interaction.
- **Inactivity Auto-Logout:** A global `SessionManager` tracks mouse, keyboard, and scroll activity. After 15 minutes of inactivity, the session is aggressively terminated, wiping local state and forcefully redirecting the user to the login screen.
- **Server-Side Auth Guards:** Layouts (like `dashboard/layout.tsx`) use asynchronous server components to cryptographically verify the user's session before a single byte of protected UI is sent to the browser.
- **Zod Schema Validation:** Every API route and form rigorously parses incoming data against typed Zod schemas (e.g., `approvalSchema`, `loginSchema`) to prevent injection attacks and bad data states.
- **Privilege Separation:** The highly sensitive `adminClient` (Supabase Service Role Key) is strictly isolated to backend API routes and only invoked *after* manual role verification to safely bypass RLS when required by complex business logic (e.g., status approvals).

## 4. API Components

ClubSpace uses Next.js Route Handlers (`src/app/api/`) to build a secure, serverless backend.

- **/api/auth:** Handles complex registration flows, domain allow-listing (ensuring users belong to the correct university), and role assignment during onboarding.
- **/api/announcements:** Manages the announcement lifecycle. Features endpoints for creating, pinning, submitting, approving (`/[id]/approve`), rejecting (`/[id]/reject`), and tracking reads.
- **/api/clubs:** Manages club settings, membership lists, and invite link generation/revocation.
- **/api/gdpr:** Specialized routes designed strictly for legal compliance (triggering data dumps or anonymizing user records).

## 5. Major Assets & Design Patterns

### Custom UI System
Instead of relying on heavy third-party component libraries, ClubSpace uses a bespoke, lightweight UI folder (`src/components/ui/`) featuring optimized `Button`, `Input`, and `Modal` components that consume standard Tailwind classes merged via `tailwind-merge` and `clsx`.

### Custom Hooks
Business logic is abstracted into clean React Hooks for easy consumption:
- `useAuth`: Manages real-time session state.
- `useRole`: Resolves the user's position in the RBAC hierarchy (`isAdmin()`, `isClubAdmin()`, etc.).
- `useAnnouncements`: Encapsulates data fetching and API mutations for the announcement system.

### Database Schema Architecture
The Postgres database is highly relational:
- **`universities` / `departments`:** The top-level grouping structures.
- **`profiles`:** Extended user data linked 1:1 with Supabase Auth users.
- **`user_roles` & `club_memberships`:** Junction tables that define the RBAC logic.
- **`announcements` & `announcement_audit_log`:** Tables tracking communication, with built-in audit trails for moderation and legal exposure control.
