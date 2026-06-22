# ClubSpace

ClubSpace is a production-ready, open-source platform for managing university student club memberships, events, and communications. It is fully configurable from the dashboard with zero hardcoded institutional values. It is legally compliant (GDPR + POPIA), secure, MIT licensed, and built to scale across multiple universities and clubs.

## Features

- **Role-Based Access Control**: Super Admin > University Admin > Club Admin > Officer > Member hierarchy
- **Club Management**: Create, edit, and manage clubs with flexible privacy and join policies
- **Member Management**: Invite links, CSV bulk import, role management
- **Events**: Create events with Google Calendar integration, attendance tracking
- **Announcements**: Send announcements to club members with read receipts
- **Notifications**: Real-time notification system with unread counts
- **GDPR Compliance**: Data export and erasure requests
- **University Administration**: Domain allowlist management, university-wide oversight
- **Super Admin Panel**: Platform-wide oversight of all universities and users
- **Public Pages**: Public club pages showing events and club information
- **Responsive Design**: Built with Tailwind CSS, works on mobile and desktop

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14, TypeScript strict, Tailwind CSS v4 |
| Database | Supabase (PostgreSQL 16 with RLS) |
| Auth | Supabase Auth (email + password) |
| Storage | Supabase Storage (avatars, club banners) |
| Backend | Next.js API Routes |
| Validation | Zod |
| Hosting | Vercel |
| Email | Supabase Auth (verification + password reset only) |
| License | MIT |

## Local Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn or pnpm or bun
- Supabase account

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/clubspace.git
   cd clubspace
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. Set up environment variables
   Create a `.env.local` file in the `frontend/` directory with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   SUPER_ADMIN_EMAIL=superadmin@youruniversity.edu
   ```

4. Set up Supabase
   - Create a new Supabase project
   - Run the SQL migrations found in `database/migrations/001_initial_schema.sql`
   - Apply the RLS policies from `database/rls-policies.sql`

5. Create the first Super Admin account
   - After setting up the database, you can create the first super admin user through the Supabase dashboard or by running SQL directly

6. Run the development server
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key from Supabase Settings → API
3. Create a service role key from Supabase Settings → API
4. Run the database migrations:
   - Execute the SQL in `database/migrations/001_initial_schema.sql`
   - Execute the SQL in `database/rls-policies.sql` to enable Row Level Security

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xyzcompany.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | `public-anon-key` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `service-role-key` |
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://localhost:3000` |
| `SUPER_ADMIN_EMAIL` | Email for first super admin | `admin@university.edu` |

## Deployment to Vercel

The easiest way to deploy ClubSpace is to use the [Vercel Platform](https://vercel.com/new?utm_source=create-next-app&utm_medium=default-template&filter=next.js&utm_campaign=create-next-app-readme) from the creators of Next.js.

1. Push your code to a GitHub/GitLab/Bitbucket repository
2. Import the repository into Vercel
3. Set the environment variables in Vercel project settings
4. Vercel will automatically build and deploy your application

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For questions or feedback, please open an issue on the GitHub repository.