// src/components/clubs/ClubModal.tsx
"use client"

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'
import styles from './ClubModal.module.css'

// ──────────────────── Types ────────────────────
type ClubData = {
  id: string
  name: string
  slug: string
  description: string | null
  privacy: 'public' | 'university' | 'members'
  join_policy: 'open' | 'invite' | 'approval'
}

type MemberData = {
  membership_id: string
  user_id: string
  role: 'admin' | 'officer' | 'member'
  joined_at: string
  first_name: string | null
  last_name: string | null
  email: string | null
  avatar_url: string | null
  student_number: string | null
}

type SearchResult = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  avatar_url: string | null
  student_number: string | null
}

interface ClubModalProps {
  club: ClubData
  isOpen: boolean
  onClose: () => void
  onUpdated: () => void
}

// ──────────────────── Helpers ────────────────────
function getInitials(firstName: string | null, lastName: string | null): string {
  const f = firstName?.charAt(0)?.toUpperCase() || ''
  const l = lastName?.charAt(0)?.toUpperCase() || ''
  return f + l || '?'
}

function formatRoleLabel(role: string): string {
  switch (role) {
    case 'admin': return 'Admin'
    case 'officer': return 'Officer'
    case 'member': return 'Member'
    default: return role
  }
}

// ──────────────────── Main Component ────────────────────
export default function ClubModal({ club, isOpen, onClose, onUpdated }: ClubModalProps) {
  const { user } = useAuth()
  const { isSuperAdmin, isUniversityAdmin } = useRole()
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'danger'>('general')

  // ── General Tab State ──
  const [formData, setFormData] = useState({
    name: club.name,
    description: club.description || '',
    privacy: club.privacy,
    join_policy: club.join_policy,
  })
  const [saving, setSaving] = useState(false)
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ── Members Tab State ──
  const [members, setMembers] = useState<MemberData[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [memberMessage, setMemberMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ── Invite Link State ──
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // ── Danger Zone State ──
  const [confirmName, setConfirmName] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Reset form when club changes
  useEffect(() => {
    setFormData({
      name: club.name,
      description: club.description || '',
      privacy: club.privacy,
      join_policy: club.join_policy,
    })
    setFormMessage(null)
    setMemberMessage(null)
    setConfirmName('')
    setDeleteError('')
    setActiveTab('general')
  }, [club.id])

  // Fetch members when tab switches
  useEffect(() => {
    if (activeTab === 'members' && isOpen) {
      fetchMembers()
    }
  }, [activeTab, isOpen])

  // ── Escape key ──
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // ──────────────── API Calls ────────────────

  // GENERAL: Save club details
  const handleSave = async () => {
    setSaving(true)
    setFormMessage(null)
    try {
      const res = await fetch(`/api/clubs/${club.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update club')
      setFormMessage({ type: 'success', text: 'Club updated successfully!' })
      onUpdated()
    } catch (err: any) {
      setFormMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  // MEMBERS: Fetch member list
  const fetchMembers = async () => {
    setMembersLoading(true)
    try {
      const res = await fetch(`/api/clubs/${club.id}/members`)
      const data = await res.json()
      if (res.ok) {
        setMembers(data.members || [])
      }
    } catch (err) {
      console.error('Failed to fetch members', err)
    } finally {
      setMembersLoading(false)
    }
  }

  // MEMBERS: Search for users to add
  const handleSearch = async (q: string) => {
    setSearchQuery(q)
    if (q.length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }
    setSearchLoading(true)
    setShowSearchResults(true)
    try {
      const res = await fetch(`/api/clubs/${club.id}/members/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (res.ok) {
        setSearchResults(data.users || [])
      }
    } catch (err) {
      console.error('Search failed', err)
    } finally {
      setSearchLoading(false)
    }
  }

  // MEMBERS: Add a member
  const handleAddMember = async (userId: string) => {
    setMemberMessage(null)
    try {
      const res = await fetch(`/api/clubs/${club.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role: 'member' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add member')
      setMemberMessage({ type: 'success', text: 'Member added successfully!' })
      setSearchQuery('')
      setSearchResults([])
      setShowSearchResults(false)
      fetchMembers()
    } catch (err: any) {
      setMemberMessage({ type: 'error', text: err.message })
    }
  }

  // MEMBERS: Update role
  const handleRoleChange = async (userId: string, newRole: string) => {
    setMemberMessage(null)
    try {
      const res = await fetch(`/api/clubs/${club.id}/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update role')
      setMemberMessage({ type: 'success', text: 'Role updated!' })
      fetchMembers()
    } catch (err: any) {
      setMemberMessage({ type: 'error', text: err.message })
    }
  }

  // MEMBERS: Remove member
  const handleRemoveMember = async (userId: string) => {
    setMemberMessage(null)
    try {
      const res = await fetch(`/api/clubs/${club.id}/members/${userId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to remove member')
      setMemberMessage({ type: 'success', text: 'Member removed.' })
      fetchMembers()
    } catch (err: any) {
      setMemberMessage({ type: 'error', text: err.message })
    }
  }

  // INVITE: Generate invite link
  const handleGenerateInvite = async () => {
    setInviteLoading(true)
    try {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      const res = await fetch(`/api/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          club_id: club.id,
          token,
          max_uses: 50,
        }),
      })
      if (res.ok) {
        const link = `${window.location.origin}/invite/${token}`
        setInviteLink(link)
      } else {
        // Fallback: use Supabase direct insert
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: session } = await supabase.auth.getSession()
        if (!session.session) throw new Error('Not authenticated')

        const { data, error } = await supabase
          .from('invite_links')
          .insert({
            club_id: club.id,
            token,
            max_uses: 50,
            use_count: 0,
            revoked: false,
            created_by: session.session.user.id,
          })
          .select()
          .single()

        if (error) throw error
        const link = `${window.location.origin}/invite/${token}`
        setInviteLink(link)
      }
    } catch (err: any) {
      console.error('Failed to generate invite', err)
      setMemberMessage({ type: 'error', text: 'Failed to generate invite link.' })
    } finally {
      setInviteLoading(false)
    }
  }

  // INVITE: Copy to clipboard
  const handleCopyLink = async () => {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = inviteLink
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // DANGER: Delete club
  const handleDelete = async () => {
    if (confirmName !== club.name) {
      setDeleteError('Club name does not match.')
      return
    }
    setDeleting(true)
    setDeleteError('')
    try {
      const res = await fetch(`/api/clubs/${club.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete club')
      onUpdated()
      onClose()
    } catch (err: any) {
      setDeleteError(err.message)
      setDeleting(false)
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const canDelete = isSuperAdmin() || isUniversityAdmin()
  // Check if user is club admin
  const currentUserMembership = members.find(m => m.user_id === user?.id)
  const isClubAdmin = currentUserMembership?.role === 'admin' || isSuperAdmin() || isUniversityAdmin()

  // ──────────────── Render ────────────────

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <h2 className={styles.title}>Manage Club</h2>
            <p className={styles.subtitle}>{club.name}</p>
          </div>
          <button onClick={onClose} className={styles.closeButton} aria-label="Close">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'general' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'members' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('members')}
          >
            Members
            <span className={styles.memberCountBadge}>{members.length || '…'}</span>
          </button>
          {canDelete && (
            <button
              className={`${styles.tab} ${activeTab === 'danger' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('danger')}
            >
              Danger Zone
            </button>
          )}
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* ─── General Tab ─── */}
          {activeTab === 'general' && (
            <>
              {formMessage && (
                <div className={formMessage.type === 'success' ? styles.successMessage : styles.errorMessage}>
                  {formMessage.text}
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="club-name">
                  Club Name
                  <span className={styles.charCount}>({formData.name.length}/100)</span>
                </label>
                <input
                  id="club-name"
                  name="name"
                  type="text"
                  className={styles.input}
                  value={formData.name}
                  onChange={handleFormChange}
                  maxLength={100}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="club-description">
                  Description
                  <span className={styles.charCount}>({formData.description.length}/2000)</span>
                </label>
                <textarea
                  id="club-description"
                  name="description"
                  className={styles.textarea}
                  value={formData.description}
                  onChange={handleFormChange}
                  maxLength={2000}
                  placeholder="Tell people what this club is about..."
                  rows={4}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="club-privacy">Privacy</label>
                  <select
                    id="club-privacy"
                    name="privacy"
                    className={styles.select}
                    value={formData.privacy}
                    onChange={handleFormChange}
                  >
                    <option value="university">University — Visible to members</option>
                    <option value="members">Private — Hidden, invite only</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="club-join-policy">Join Policy</label>
                  <select
                    id="club-join-policy"
                    name="join_policy"
                    className={styles.select}
                    value={formData.join_policy}
                    onChange={handleFormChange}
                  >
                    <option value="open">Open — University Members Only</option>
                    <option value="approval">Approval — Requires approval</option>
                    <option value="invite">Invite Only</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* ─── Members Tab ─── */}
          {activeTab === 'members' && (
            <>
              {memberMessage && (
                <div className={memberMessage.type === 'success' ? styles.successMessage : styles.errorMessage}>
                  {memberMessage.text}
                </div>
              )}

              {/* Search to add member */}
              {isClubAdmin && (
                <div className={styles.searchBar}>
                  <svg className={styles.searchIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search by name or email to add members..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => { if (searchResults.length > 0) setShowSearchResults(true) }}
                    onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                  />
                  {showSearchResults && (
                    <div className={styles.searchResults}>
                      {searchLoading ? (
                        <div className={styles.searchResultItem}>
                          <span className={styles.searchResultEmail}>Searching...</span>
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className={styles.searchResultItem}>
                          <span className={styles.searchResultEmail}>No users found</span>
                        </div>
                      ) : (
                        searchResults.map((u) => (
                          <div
                            key={u.id}
                            className={styles.searchResultItem}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleAddMember(u.id)}
                          >
                            <div className={styles.searchResultAvatar}>
                              {getInitials(u.first_name, u.last_name)}
                            </div>
                            <div className={styles.searchResultInfo}>
                              <div className={styles.searchResultName}>
                                {u.first_name} {u.last_name}
                              </div>
                              <div className={styles.searchResultEmail}>{u.email}</div>
                            </div>
                            <button className={styles.addButton} type="button">
                              + Add
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Member List */}
              {membersLoading ? (
                <div className={styles.spinner}>
                  <div className={styles.spinnerDot} />
                </div>
              ) : members.length === 0 ? (
                <div className={styles.emptyState}>
                  <svg className={styles.emptyIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className={styles.emptyText}>No members yet. Add members using the search bar above.</p>
                </div>
              ) : (
                <div className={styles.memberList}>
                  {members.map((member) => (
                    <div key={member.membership_id} className={styles.memberItem}>
                      <div className={styles.memberAvatar}>
                        {getInitials(member.first_name, member.last_name)}
                      </div>
                      <div className={styles.memberInfo}>
                        <div className={styles.memberName}>
                          {member.first_name} {member.last_name}
                          {member.user_id === user?.id && ' (You)'}
                        </div>
                        <div className={styles.memberEmail}>{member.email}</div>
                      </div>
                      <div className={styles.memberActions}>
                        {isClubAdmin && member.user_id !== user?.id ? (
                          <>
                            <select
                              className={styles.roleSelect}
                              value={member.role}
                              onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                            >
                              <option value="member">Member</option>
                              <option value="officer">Officer</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              className={styles.removeButton}
                              onClick={() => handleRemoveMember(member.user_id)}
                              title="Remove member"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                            {formatRoleLabel(member.role)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Invite Link Section */}
              {isClubAdmin && (
                <div className={styles.inviteSection}>
                  <h4 className={styles.inviteSectionTitle}>Invite Link</h4>
                  {inviteLink ? (
                    <div className={styles.inviteLinkRow}>
                      <input
                        type="text"
                        className={styles.inviteLinkInput}
                        value={inviteLink}
                        readOnly
                      />
                      <button className={styles.copyButton} onClick={handleCopyLink}>
                        {copied ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                  ) : (
                    <button
                      className={styles.generateButton}
                      onClick={handleGenerateInvite}
                      disabled={inviteLoading}
                    >
                      {inviteLoading ? 'Generating...' : 'Generate Invite Link'}
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* ─── Danger Zone Tab ─── */}
          {activeTab === 'danger' && canDelete && (
            <div className={styles.dangerZone}>
              <h3 className={styles.dangerTitle}>Delete Club</h3>
              <p className={styles.dangerDescription}>
                This action <strong>cannot</strong> be undone. Deleting <strong>{club.name}</strong> will
                permanently remove all associated memberships and club announcements.
                User accounts and university roles will <strong>not</strong> be affected.
              </p>
              <label className={styles.label} htmlFor="confirm-delete">
                Type <strong style={{ color: '#ef4444' }}>{club.name}</strong> to confirm
              </label>
              <input
                id="confirm-delete"
                type="text"
                className={styles.dangerInput}
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={club.name}
              />
              {deleteError && (
                <div className={styles.errorMessage}>{deleteError}</div>
              )}
              <button
                className={styles.deleteButton}
                onClick={handleDelete}
                disabled={deleting || confirmName !== club.name}
              >
                {deleting ? 'Deleting...' : 'Permanently Delete Club'}
              </button>
            </div>
          )}
        </div>

        {/* Footer (only for General tab) */}
        {activeTab === 'general' && (
          <div className={styles.footer}>
            <button className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button className={styles.saveButton} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
