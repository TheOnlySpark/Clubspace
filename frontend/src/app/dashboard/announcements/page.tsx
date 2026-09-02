"use client";

// src/app/dashboard/announcements/page.tsx
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import AnnouncementForm from '@/components/announcements/AnnouncementForm'
import AnnouncementList from '@/components/announcements/AnnouncementList'
import ApprovalQueue from '@/components/announcements/ApprovalQueue'
import PinnedBanner from '@/components/announcements/PinnedBanner'
import Button from '@/components/ui/Button'

type Tab = 'all' | 'drafts' | 'pending'

export default function AnnouncementsPage() {
  const { user } = useAuth()
  const { role, isAdmin, isClubAdmin, isUniversityAdmin, isSuperAdmin } = useRole()
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [showForm, setShowForm] = useState(false)

  const canCreate = role === 'officer' || isAdmin()
  const canApprove = isClubAdmin() || isUniversityAdmin() || isSuperAdmin()

  // Fetch based on active tab
  const statusFilter = activeTab === 'all' ? 'published' : activeTab === 'drafts' ? 'draft' : activeTab === 'pending' ? 'pending_approval' : undefined
  const {
    announcements,
    loading,
    error,
    createAnnouncement,
    deleteAnnouncement,
    submitForApproval,
    approve,
    reject,
    togglePin,
    markAsRead,
  } = useAnnouncements({ status: statusFilter })

  const handleCreate = async (data: any) => {
    await createAnnouncement(data)
    setShowForm(false)
  }

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: 'all', label: 'Published', show: true },
    { id: 'drafts', label: 'My Drafts', show: canCreate },
    { id: 'pending', label: 'Pending Approval', show: canApprove },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Announcements</h1>
          <p className="text-sm text-slate-500 mt-1">Create, manage, and review announcements</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => setShowForm(!showForm)}
            className="w-full sm:w-auto"
          >
            {showForm ? 'Cancel' : '+ New Announcement'}
          </Button>
        )}
      </div>

      {/* Composer */}
      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">New Announcement</h2>
          <AnnouncementForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Pinned Banner */}
      <PinnedBanner />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 pb-px">
        {tabs.filter(t => t.show).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'text-indigo-700 border-b-2 border-indigo-700 bg-indigo-50/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 font-medium">Loading announcements...</div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 font-medium mb-2">{error}</p>
          <a href="/dashboard" className="text-sm text-indigo-600 hover:underline">Go back to dashboard</a>
        </div>
      ) : activeTab === 'pending' ? (
        <ApprovalQueue />
      ) : (
        <AnnouncementList
          announcements={announcements}
          onDelete={deleteAnnouncement}
          onPin={togglePin}
          onApprove={approve}
          onReject={reject}
          onSubmit={submitForApproval}
          onRead={markAsRead}
        />
      )}
    </div>
  )
}