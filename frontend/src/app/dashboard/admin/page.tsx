// src/app/dashboard/admin/page.tsx
"use client";

import { useEffect, useState } from 'react'
import { useAuth, useRole } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/server'
import UniversitySettings from '@/components/admin/UniversitySettings'
import ClubManager from '@/components/admin/ClubManager'
import UserRoleTable from '@/components/admin/UserRoleTable'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export default function AdminPage() {
  const { user } = useAuth()
  const { isUniversityAdmin, isSuperAdmin } = useRole()
  const [university, setUniversity] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setUniversity(null)
      setLoading(false)
      return
    }
    fetchUniversity()
  }, [user])

  const fetchUniversity = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      // Get the user's profile to get university_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('university_id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        throw new Error('Profile not found')
      }

      const universityId = profile.university_id

      // Get the university details
      const { data: universityData, error: universityError } = await supabase
        .from('universities')
        .select('*')
        .eq('id', universityId)
        .single()

      if (universityError) {
        throw universityError
      }

      setUniversity(universityData)
      setError(null)
    } catch (err: any) {
      console.error('Error loading university data:', err)
      setError(err.message ?? 'Failed to load university data')
      setUniversity(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <h2 className="text-2xl font-bold text-primary">Loading admin panel...</h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <h2 className="text-2xl font-bold text-primary">Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <a href="/dashboard" className="font-medium text-primary hover:underline">
            Go back to dashboard
          </a>
        </div>
      </div>
    )
  }

  if (!university) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <h2 className="text-2xl font-bold text-primary">No university found</h2>
          <p className="text-muted-foreground">
            You are not associated with any university. Please contact a super admin.
          </p>
        </div>
      </div>
    )
  }

  // Only university admins and super admins can access this page
  if (!isUniversityAdmin && !isSuperAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <h2 className="text-2xl font-bold text-primary">Forbidden</h2>
          <p className="text-muted-foreground">
            You do not have permission to access the admin panel.
          </p>
          <a href="/dashboard" className="font-medium text-primary hover:underline">
            Go back to dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-primary">University Admin Panel</h1>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            variant="outline"
            onClick={() => {
              // TODO: refresh
            }}
            className="w-full md:w-auto"
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-primary mb-4">University Overview</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Name</label>
            <p className="text-lg font-medium">{university.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Slug</label>
            <p className="text-sm font-medium">{university.slug}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Domain Allowlist</label>
            <p className="text-sm font-medium">
              {university.domain_allowlist?.length > 0
                ? university.domain_allowlist.join(', ')
                : 'No domains allowed'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-primary mb-4">Manage University</h2>
        <div className="space-y-4">
          <UniversitySettings university={university} onUpdate={fetchUniversity} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-primary mb-4">Clubs Management</h2>
        <ClubManager universityId={university.id} onClubUpdate={() => {
          // TODO: refresh clubs list if needed
        }} />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-primary mb-4">User Roles</h2>
        <UserRoleTable universityId={university.id} onRoleUpdate={() => {
          // TODO: refresh roles if needed
        }} />
      </div>
    </div>
  )
}