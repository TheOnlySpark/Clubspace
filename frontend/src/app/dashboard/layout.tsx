// src/app/dashboard/layout.tsx
import type { Metadata } from 'next'
import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'
import { getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SessionManager from '@/components/auth/SessionManager'

export const metadata: Metadata = {
  title: 'ClubSpace Dashboard',
  description: 'Manage your university club memberships, events, and communications.',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: { user }, error } = await getUser()

  // If no user or error, redirect to login
  if (error || !user) {
    redirect('/auth/login')
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SessionManager />
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}