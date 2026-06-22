// src/app/dashboard/superadmin/page.tsx
"use client"
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export default function SuperAdminPage() {
  const { user } = useAuth()
  const { isSuperAdmin } = useRole()
  const [overview, setOverview] = useState<any>(null)
  const [universities, setUniversities] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !isSuperAdmin) {
      setLoading(false)
      return
    }
    fetchOverview()
    fetchUniversities()
    fetchUsers()
  }, [user, isSuperAdmin])

  const fetchOverview = async () => {
    try {
      const response = await fetch('/api/superadmin/overview')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch overview')
      }
      const data = await response.json()
      setOverview(data)
    } catch (err: any) {
      console.error('Error fetching overview:', err)
      setError(err.message ?? 'Failed to load overview')
    }
  }

  const fetchUniversities = async () => {
    try {
      const response = await fetch('/api/superadmin/universities')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch universities')
      }
      const data = await response.json()
      setUniversities(data)
    } catch (err: any) {
      console.error('Error fetching universities:', err)
      setError(err.message ?? 'Failed to load universities')
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/superadmin/users')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch users')
      }
      const data = await response.json()
      setUsers(data)
    } catch (err: any) {
      console.error('Error fetching users:', err)
      setError(err.message ?? 'Failed to load users')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <h2 className="text-2xl font-bold text-primary">Loading Super Admin panel...</h2>
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

  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <h2 className="text-2xl font-bold text-primary">Forbidden</h2>
          <p className="text-muted-foreground">
            You do not have permission to access the Super Admin panel.
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
        <h1 className="text-2xl font-bold text-primary">Super Admin Panel</h1>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            variant="outline"
            onClick={() => {
              // Refresh all data
              setLoading(true)
              fetchOverview()
              fetchUniversities()
              fetchUsers()
                .finally(() => setLoading(false))
            }}
            className="w-full md:w-auto"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Section */}
      {overview && (
        <div className="glass-panel border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-primary mb-4">Platform Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Universities</h3>
              <p className="text-2xl font-bold text-primary">{overview.universities}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Users</h3>
              <p className="text-2xl font-bold text-primary">{overview.users}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Clubs</h3>
              <p className="text-2xl font-bold text-primary">{overview.clubs}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Events</h3>
              <p className="text-2xl font-bold text-primary">{overview.events}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary mb-2">Announcements</h3>
              <p className="text-2xl font-bold text-primary">{overview.announcements}</p>
            </div>
          </div>
        </div>
      )}

      {/* Universities Section */}
      <div className="glass-panel border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-primary mb-4">Universities</h2>
        {universities.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground">No universities found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Created At
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {universities.map((uni) => (
                  <tr key={uni.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {uni.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {uni.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(uni.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Users Section */}
      <div className="glass-panel border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-primary mb-4">Users</h2>
        {users.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Student Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    University
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {user.first_name || ''} {user.last_name || ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {user.student_number || ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground capitalize">
                      {user.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {user.university?.name || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}