// src/app/dashboard/members/page.tsx
"use client"
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'
import { createClient } from '@/lib/supabase/client'
import MemberTable from '@/components/members/MemberTable'
import RoleSelector from '@/components/members/RoleSelector'
import RemoveMemberModal from '@/components/members/RemoveMemberModal'
import Button from '@/components/ui/Button'

interface Member {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  course: string | null
  role: string
  created_at: string
}

export default function MembersPage() {
  const { user } = useAuth()
  const { role: userRole, isUniversityAdmin, isSuperAdmin } = useRole()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [selectedMemberDetails, setSelectedMemberDetails] = useState<any | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [removeModalOpen, setRemoveModalOpen] = useState(false)

  const canChangeRoles = isUniversityAdmin() || isSuperAdmin()

  // Fetch members for the user's university
  async function loadMembers() {
    if (!user) return

    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()

      // Get the user's profile to get university_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('university_id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile?.university_id) {
        throw new Error('Could not determine your university.')
      }

      const universityId = profile.university_id

      // Get all profiles for this university with their roles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, course, created_at')
        .eq('university_id', universityId)
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      // Fetch roles separately to avoid the inner join crash
      const userIds = (profilesData || []).map((p: any) => p.id)
      let rolesMap: Record<string, string> = {}

      if (userIds.length > 0) {
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds)

        if (!rolesError && rolesData) {
          for (const r of rolesData) {
            rolesMap[r.user_id] = r.role
          }
        }
      }

      // Merge profiles + roles
      const formattedMembers: Member[] = (profilesData || []).map((member: any) => ({
        id: member.id,
        first_name: member.first_name,
        last_name: member.last_name,
        email: member.email,
        course: member.course,
        role: rolesMap[member.id] || 'member',
        created_at: member.created_at,
      }))

      setMembers(formattedMembers)
    } catch (err: any) {
      console.error('Error loading members:', err)
      setError(err.message ?? 'Failed to load members')
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch details of a single member (including student number)
  async function fetchMemberDetails(memberId: string) {
    setDetailsLoading(true)
    try {
      const supabase = createClient()

      // Fetch profile details (including student_number)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, course, created_at, student_number')
        .eq('id', memberId)
        .single()

      if (profileError) throw profileError

      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', memberId)
        .maybeSingle()

      setSelectedMemberDetails({
        ...profile,
        role: roleData?.role || 'member'
      })
    } catch (err: any) {
      console.error('Error fetching member details:', err)
    } finally {
      setDetailsLoading(false)
    }
  }

  // Load details whenever selectedMember changes
  useEffect(() => {
    if (selectedMember) {
      fetchMemberDetails(selectedMember.id)
    } else {
      setSelectedMemberDetails(null)
    }
  }, [selectedMember?.id])

  // Handle role change — only uni admin / super admin
  async function handleRoleChange(memberId: string, newRole: string) {
    if (!canChangeRoles) return

    try {
      const response = await fetch(`/api/admin/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update role')
      }

      // Update optimistically in the list
      setMembers(prev =>
        prev.map(member =>
          member.id === memberId ? { ...member, role: newRole } : member
        )
      )
      // Update details panel
      setSelectedMemberDetails((prev: any) => prev ? { ...prev, role: newRole } : null)
    } catch (err: any) {
      console.error('Error changing role:', err)
      alert('Failed to change role: ' + err.message)
    }
  }

  // Handle remove member — removes from club_memberships only
  async function handleRemoveMember(memberId: string) {
    try {
      const supabase = createClient()

      // Delete all club memberships for this user (club-level removal only)
      const { error } = await supabase
        .from('club_memberships')
        .delete()
        .eq('user_id', memberId)

      if (error) throw error

      // Refresh the list to show updated data
      await loadMembers()
      setRemoveModalOpen(false)
      setSelectedMember(null)
    } catch (err: any) {
      console.error('Error removing member:', err)
      alert('Failed to remove member: ' + err.message)
    }
  }

  // Load members on mount
  useEffect(() => {
    if (user) {
      loadMembers()
    }
  }, [user])

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-bold tracking-tight text-gradient">Members</h1>
            <div className="h-5 w-64 bg-muted/40 rounded-md animate-pulse" />
          </div>
          <div className="h-10 w-24 bg-muted/40 rounded-lg animate-pulse" />
        </div>

        {/* Skeleton search bar */}
        <div className="solid-card rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="h-10 w-64 bg-muted/30 rounded-lg animate-pulse" />
            <div className="h-10 w-32 bg-muted/30 rounded-lg animate-pulse hidden md:block" />
          </div>

          {/* Skeleton table header */}
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="bg-muted/20 px-4 py-3 flex gap-4">
              {['w-28', 'w-28', 'w-44', 'w-32', 'w-20', 'w-24'].map((w, i) => (
                <div key={i} className={`h-4 ${w} bg-muted/40 rounded animate-pulse`} />
              ))}
            </div>

            {/* Skeleton rows */}
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="px-4 py-4 flex gap-4 border-t border-border"
                style={{ opacity: 1 - i * 0.12 }}
              >
                {['w-28', 'w-28', 'w-44', 'w-32', 'w-20', 'w-24'].map((w, j) => (
                  <div key={j} className={`h-4 ${w} bg-muted/30 rounded animate-pulse`} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight text-gradient">Members</h1>
        </div>
        <div className="solid-card rounded-2xl p-8 text-center">
          <p className="text-destructive font-medium mb-2">Something went wrong</p>
          <p className="text-muted-foreground text-sm mb-4">{error}</p>
          <Button onClick={loadMembers} variant="outline">Try again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight text-gradient">Members</h1>
          <p className="text-muted-foreground text-lg">
            {members.length} member{members.length !== 1 ? 's' : ''} at your university
          </p>
        </div>
        <Button variant="outline" onClick={loadMembers}>
          Refresh
        </Button>
      </div>

      {members.length > 0 ? (
        <MemberTable
          columns={[
            { accessor: 'first_name', header: 'First Name', sortable: true },
            { accessor: 'last_name', header: 'Last Name', sortable: true },
            { accessor: 'email', header: 'Email', sortable: true },
            { accessor: 'course', header: 'Course', sortable: true },
            { accessor: 'role', header: 'Role', sortable: true },
            { accessor: 'created_at', header: 'Joined', sortable: true },
          ]}
          data={members}
          onRowClick={(member) => setSelectedMember(member)}
        />
      ) : (
        <div className="solid-card rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">No members found.</p>
        </div>
      )}

      {/* Member details panel */}
      {selectedMember && (
        <div className="solid-card rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Member Details</h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchMemberDetails(selectedMember.id)}
                disabled={detailsLoading}
              >
                {detailsLoading ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setSelectedMember(null); setSelectedMemberDetails(null); }}>
                ✕
              </Button>
            </div>
          </div>

          {detailsLoading && !selectedMemberDetails ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : selectedMemberDetails ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                  {selectedMemberDetails.first_name?.[0]?.toUpperCase()}{selectedMemberDetails.last_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">
                    {selectedMemberDetails.first_name} {selectedMemberDetails.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{selectedMemberDetails.email}</p>
                  {selectedMemberDetails.course && (
                    <p className="text-sm text-muted-foreground mt-0.5">📚 {selectedMemberDetails.course}</p>
                  )}
                  {selectedMemberDetails.student_number && (
                    <p className="text-sm text-muted-foreground mt-0.5">🆔 Student Number: {selectedMemberDetails.student_number}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <span className="font-medium text-foreground">Role:</span>
                <RoleSelector
                  currentRole={selectedMemberDetails.role as any}
                  onRoleChange={(newRole) => handleRoleChange(selectedMemberDetails.id, newRole)}
                  disabled={!canChangeRoles || detailsLoading}
                  isSuperAdmin={isSuperAdmin()}
                />
              </div>

              {canChangeRoles && (
                <div className="pt-2 border-t border-border">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setRemoveModalOpen(true)}
                    disabled={detailsLoading}
                  >
                    Remove from all clubs
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground py-4">Failed to load member details.</p>
          )}
        </div>
      )}

      {/* Remove member modal */}
      {selectedMember && (
        <RemoveMemberModal
          member={selectedMember as any}
          open={removeModalOpen}
          onOpenChange={setRemoveModalOpen}
          onConfirm={handleRemoveMember}
        />
      )}
    </div>
  )
}