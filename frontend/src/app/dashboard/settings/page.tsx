// src/app/dashboard/settings/page.tsx
"use client";

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'
import { createClient } from '@/lib/supabase/client'
import InviteGenerator from '@/components/invites/InviteGenerator'
import InviteTable from '@/components/invites/InviteTable'
import AnnouncementSettingsPanel from '@/components/announcements/AnnouncementSettingsPanel'
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
        // Not a member of any club. This is fine for Super Admins who just want to access global settings.
        setClub(null)
        setInvites([])
        setError(null)
      } else {
        // Use the first club as the current club
        const clubData: any = Array.isArray(userClubs[0].clubs) ? userClubs[0].clubs[0] : userClubs[0].clubs

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
      }
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
      setClub((prev: any) => prev ? { ...prev, ...updates } : null)
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

  // Removed the early return for !club so that admins can still see their global settings

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-primary">Club Settings</h1>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            variant="outline"
            onClick={() => setShowGenerator(true)}
            disabled={!(isClubAdmin() || isUniversityAdmin() || isSuperAdmin())}
            className="w-full md:w-auto"
          >
            Generate Invite Link
          </Button>
        </div>
      </div>

      {/* Club Info Section (Only visible if in a club) */}
      {club && (
        <div className="glass-panel p-6 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Club Information
        </h2>
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
        {isClubAdmin() || isUniversityAdmin() || isSuperAdmin() && (
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
                    variant="default"
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
      )}

      {/* Invite Links Section (Only visible if in a club) */}
      {club && (
      <div className="glass-panel p-6 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          Invite Links
        </h2>
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
      )}

      {/* GDPR Actions Section */}
      <div className="glass-panel p-6 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          Data & Privacy
        </h2>
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

      {/* Announcement Settings Section */}
      {(isUniversityAdmin() || isSuperAdmin()) && (
        <AnnouncementSettingsPanel />
      )}
    </div>
  )
}