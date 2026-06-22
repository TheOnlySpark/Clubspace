// src/app/dashboard/members/page.tsx
"use client"
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'
import { createClient } from '@/lib/supabase/client'
import MemberTable from '@/components/members/MemberTable'
import RoleSelector from '@/components/members/RoleSelector'
import RemoveMemberModal from '@/components/members/RemoveMemberModal'
import Button from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'

export default function MembersPage() {
  const { user } = useAuth()
  const { role: userRole, isUniversityAdmin, isSuperAdmin } = useRole()
  const [members, setMembers] = useState<Array<any>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMember, setSelectedMember] = useState<any | null>(null)
  const [removeModalOpen, setRemoveModalOpen] = useState(false)

  // Fetch members for the user's university
  async function loadMembers() {
    if (!user) return

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

      // Get all profiles for this university
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, created_at, user_roles!inner(role)')
        .eq('university_id', universityId)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      // Format the data for the table
      const formattedMembers = data.map((member: any) => ({
        id: member.id,
        first_name: member.first_name,
        last_name: member.last_name,
        email: member.email,
        role: member.user_roles.role || 'member',
        created_at: member.created_at,
      }))

      setMembers(formattedMembers)
      setError(null)
    } catch (err: any) {
      console.error('Error loading members:', err)
      setError(err.message ?? 'Failed to load members')
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  // Handle role change
  async function handleRoleChange(memberId: string, newRole: string) {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', memberId)

      if (error) {
        throw error
      }

      // Update the members list optimistically
      setMembers(prev =>
        prev.map(member =>
          member.id === memberId ? { ...member, role: newRole } : member
        )
      )
    } catch (err: any) {
      console.error('Error changing role:', err)
      // TODO: show error toast
      alert('Failed to change role: ' + err.message)
    }
  }

  // Handle remove member
  async function handleRemoveMember(memberId: string) {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', memberId)

      if (error) {
        throw error
      }

      // Remove from members list
      setMembers(prev => prev.filter(member => member.id !== memberId))
      setRemoveModalOpen(false)
    } catch (err: any) {
      console.error('Error removing member:', err)
      // TODO: show error toast
      alert('Failed to remove member: ' + err.message)
    }
  }

  // Load members on mount
  React.useEffect(() => {
    loadMembers()
  }, [user])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <h2 className="text-2xl font-bold text-primary">Loading members...</h2>
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
    );
}

return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-primary">Members</h1>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            variant="outline"
            onClick={loadMembers}
            className="hidden sm:block"
          >
            Refresh
          </Button>
        </div>
      </div>

      {members.length > 0 ? (
        <MemberTable
          columns={[
            {
              accessor: 'first_name',
              header: 'First Name',
              sortable: true,
            },
            {
              accessor: 'last_name',
              header: 'Last Name',
              sortable: true,
            },
            {
              accessor: 'email',
              header: 'Email',
              sortable: true,
            },
            {
              accessor: 'role',
              header: 'Role',
              sortable: true,
            },
            {
              accessor: 'created_at',
              header: 'Joined',
              sortable: true,
            },
          ]}
          data={members}
          onRowClick={(member) => {
            setSelectedMember(member)
          }}
        />
      ) : (
        <p className="text-muted-foreground">No members found.</p>
      )}

      {/* Member details sidebar (if selected) */}
      {selectedMember && (
        <div className="mt-6 border-t pt-6">
          <h2 className="text-xl font-semibold text-primary mb-4">
            Member details
          </h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                {selectedMember.first_name?.[0]}{selectedMember.last_name?.[0]}
              </div>
              <div>
                <h3 className="font-bold text-lg">
                  {selectedMember.first_name} {selectedMember.last_name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedMember.email}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-4">
                <span className="font-medium">Role:</span>
                <RoleSelector
                  currentRole={selectedMember.role as any}
                  onRoleChange={(newRole) => handleRoleChange(selectedMember.id, newRole)}
                  disabled={!(isUniversityAdmin || isSuperAdmin)} // Only university admin or super admin can change roles here
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove member modal */}
      <RemoveMemberModal
        member={selectedMember as any}
        open={removeModalOpen}
        onOpenChange={(open) => setRemoveModalOpen(open)}
        onConfirm={handleRemoveMember}
      />
    </div>
  )
}