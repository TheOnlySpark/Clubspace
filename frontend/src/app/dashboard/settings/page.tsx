// src/app/dashboard/settings/page.tsx
"use client";

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'
import { createClient } from '@/lib/supabase/client'
import InviteGenerator from '@/components/invites/InviteGenerator'
import InviteTable from '@/components/invites/InviteTable'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'

export default function SettingsPage() {
  const { user } = useAuth()
  const { role: userRole, isClubAdmin, isUniversityAdmin, isSuperAdmin } = useRole()
  const [club, setClub] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [invites, setInvites] = useState<Array<any>>([])
  const [showGenerator, setShowGenerator] = useState(false)
  // Form state for editing club settings
  const [editClubName, setEditClubName] = useState<string>('')
  const [editClubDescription, setEditClubDescription] = useState<string>('')
  const [editClubPrivacy, setEditClubPrivacy] = useState<string>('')
  const [editClubJoinPolicy, setEditClubJoinPolicy] = useState<string>('')
  const [isEditingClub, setIsEditingClub] = useState(false)
  const [clubEditLoading, setClubEditLoading] = useState(false)
  const [clubEditError, setClubEditError] = useState<string | null>(null)
  // GDPR actions state
  const [gdprLoading, setGdprLoading] = useState(false)
  const [gdprError, setGdprError] = useState<string | null>(null)
  const [gdprSuccess, setGdprSuccess] = useState<string | null>(null)

  // Fetch the user's club (first club they are a member of)
  useEffect(() => {
    fetchClub()
  }, [user])

  const fetchClub = async () => {
    if (!user) return

    setLoading(true)
    try {
      const supabase = createClient()

      // Get the user's profile to get university_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('university_id, id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        throw new Error('Profile not found')
      }

      const universityId = profile.university_id
      const userId = profile.id

      // Get the user's clubs in the university
      const { data: userClubs, error: userClubsError } = await supabase
        .from('club_memberships')
        .select('club_id, clubs!inner(id, name, description, banner_url, privacy, join_policy, settings)')
        .eq('user_id', userId)
        .eq('clubs.university_id', universityId)

      if (userClubsError) {
        throw userClubsError
      }

      if (userClubs.length === 0) {
        throw new Error('You are not a member of any club in this university')
      }

      // Use the first club as the current club
      const clubData = userClubs[0].clubs

      setClub(clubData)
      // Initialize form values
      setEditClubName(clubData.name || '')
      setEditClubDescription(clubData.description || '')
      setEditClubPrivacy(clubData.privacy || 'university')
      setEditClubJoinPolicy(clubData.join_policy || 'invite')

      // Fetch invites for this club
      const { data: invitesData, error: invitesError } = await supabase
        .from('invite_links')
        .select('*')
        .eq('club_id', clubData.id)
        .order('created_at', { ascending: false })

      if (invitesError) {
        throw invitesError
      }

      setInvites(invitesData)
      setError(null)
    } catch (err: any) {
      console.error('Error loading club data:', err)
      setError(err.message ?? 'Failed to load club data')
      setClub(null)
      setInvites([])
    } finally {
      setLoading(false)
    }
  }

  // Handle updating club settings
  const handleUpdateClub = async () => {
    if (!club) return

    setClubEditLoading(true)
    setClubEditError(null)
    try {
      const supabase = createClient()
      const updates = {
        name: editClubName,
        description: editClubDescription,
        privacy: editClubPrivacy,
        join_policy: editClubJoinPolicy,
      }

      const { error } = await supabase
        .from('clubs')
        .update(updates)
        .eq('id', club.id)

      if (error) {
        throw error
      }

      // Update the club state
      setClub(prev => prev ? { ...prev, ...updates } : null)
      setIsEditingClub(false)
    } catch (err: any) {
      console.error('Error updating club:', err)
      setClubEditError(err.message ?? 'Failed to update club settings')
    } finally {
      setClubEditLoading(false)
    }
  }

  // Handle generating a new invite link
  const handleInviteCreated = (newInvite: any) => {
    setInvites(prev => [newInvite, ...prev])
    setShowGenerator(false)
  }

  // Handle revoking an invite link
  const handleRevokeInvite = async (inviteId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('invite_links')
        .update({ revoked: true })
        .eq('id', inviteId)

      if (error) {
        throw error
      }

      // Update the invites list
      setInvites(prev => prev.map(invite =>
        invite.id === inviteId ? { ...invite, revoked: true } : invite
      ))
    } catch (err: any) {
      console.error('Error revoking invite:', err)
      setError(err.message ?? 'Failed to revoke invite link')
    }
  }

  // Handle GDPR data export
  const handleGdprExport = async () => {
    setGdprLoading(true)
    setGdprError(null)
    setGdprSuccess(null)
    try {
      // Trigger download via API endpoint
      const response = await fetch('/api/gdpr/export', {
        method: 'GET',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to export data')
      }

      // The API will return a file download, we just need to handle success
      setGdprSuccess('Data export initiated. Check your downloads.')
    } catch (err: any) {
      setGdprError(err.message ?? 'Failed to export data')
    } finally {
      setGdprLoading(false)
    }
  }

  // Handle GDPR data erasure
  const handleGdprErase = async () => {
    setGdprLoading(true)
    setGdprError(null)
    setGdprSuccess(null)
    try {
      const response = await fetch('/api/gdpr/erase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process erasure request')
      }

      setGdprSuccess('Data erasure request processed. Your data will be anonymized.')
    } catch (err: any) {
      setGdprError(err.message ?? 'Failed to process erasure request')
    } finally {
      setGdprLoading(false)
    }
  }

  // Handle copying invite token
  const handleCopyInvite = (token: string) => {
    navigator.clipboard.writeText(token).then(() => {
      // TODO: show a toast or temporary feedback
      alert('Invite link copied to clipboard')
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <h2 className="text-2xl font-bold text-primary">Loading settings...</h2>
        </div>
      </div>
    );
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

  if (!club) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <h2 className="text-2xl font-bold text-primary">No club found</h2>
          <p className="text-muted-foreground">
            You are not a member of any club. Please join a club to access settings.
          </p>
          <a href="/dashboard/clubs" className="font-medium text-primary hover:underline">
            Go to clubs
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-primary">Club Settings</h1>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            variant="outline"
            onClick={() => setShowGenerator(true)}
            disabled={!(isClubAdmin || isUniversityAdmin || isSuperAdmin)}
            className="w-full md:w-auto"
          >
            Generate Invite Link
          </Button>
        </div>
      </div>

      {/* Club Info Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-primary mb-4">Club Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Name</label>
            <p className="text-lg font-medium">{club.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Description</label>
            <p className="text-muted-foreground">{club.description || 'No description'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Privacy</label>
            <p className="text-sm font-medium">{club.privacy}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Join Policy</label>
            <p className="text-sm font-medium">{club.join_policy}</p>
          </div>
        </div>

        {/* Edit club info (only for admins) */}
        {isClubAdmin || isUniversityAdmin || isSuperAdmin && (
          <div className="mt-6 pt-4 border-t">
            <h3 className="text-lg font-semibold text-primary mb-4">Edit Club Information</h3>
            {clubEditError && <p className="text-sm text-destructive mb-4">{clubEditError}</p>}
            {isEditingClub ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Name</label>
                  <input
                    type="text"
                    value={editClubName}
                    onChange={(e) => setEditClubName(e.target.value)}
                    className={cn(
                      'block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                      clubEditError ? 'border-destructive' : ''
                    )}
                  />
                  {clubEditError && <p className="text-sm text-destructive">{clubEditError}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Description</label>
                  <textarea
                    value={editClubDescription}
                    onChange={(e) => setEditClubDescription(e.target.value)}
                    className={cn(
                      'block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                      clubEditError ? 'border-destructive' : ''
                    )}
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Privacy</label>
                    <select
                      value={editClubPrivacy}
                      onChange={(e) => setEditClubPrivacy(e.target.value)}
                      className={cn(
                        'block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                        clubEditError ? 'border-destructive' : ''
                      )}
                    >
                      <option value="public">Public</option>
                      <option value="university">University</option>
                      <option value="members">Members Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Join Policy</label>
                    <select
                      value={editClubJoinPolicy}
                      onChange={(e) => setEditClubJoinPolicy(e.target.value)}
                      className={cn(
                        'block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                        clubEditError ? 'border-destructive' : ''
                      )}
                    >
                      <option value="open">Open</option>
                      <option value="invite">Invite Only</option>
                      <option value="approval">Approval Required</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingClub(false)}
                    className="w-full md:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleUpdateClub}
                    disabled={clubEditLoading}
                    className="w-full md:w-auto"
                  >
                    {clubEditLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditingClub(true)
                  }}
                  className="w-full md:w-auto"
                >
                  Edit
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invite Links Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-primary mb-4">Invite Links</h2>
        {showGenerator && (
          <div className="mb-6">
            <InviteGenerator
              clubId={club.id}
              onInviteCreated={handleInviteCreated}
              className="w-full"
            />
          </div>
        )}
        <InviteTable
          invites={invites}
          onRevoke={handleRevokeInvite}
          onCopy={handleCopyInvite}
        />
      </div>

      {/* GDPR Actions Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-primary mb-4">Data & Privacy</h2>
        <p className="text-muted-foreground mb-4">
          Export your data or request erasure in accordance with GDPR and POPIA regulations.
        </p>
        <div className="space-y-4">
          <Button
            variant="outline"
            onClick={handleGdprExport}
            disabled={gdprLoading}
            className="w-full md:w-auto"
          >
            {gdprLoading ? 'Exporting...' : 'Export My Data'}
          </Button>
          <Button
            variant="destructive"
            onClick={handleGdprErase}
            disabled={gdprLoading}
            className="w-full md:w-auto"
          >
            {gdprLoading ? 'Processing...' : 'Request Data Erasure'}
          </Button>
        </div>

        {gdprError && <p className="text-sm text-destructive">{gdprError}</p>}
        {gdprSuccess && <p className="text-sm text-success">{gdprSuccess}</p>}
      </div>
    </div>
  )
}