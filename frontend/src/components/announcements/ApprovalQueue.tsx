// src/components/announcements/ApprovalQueue.tsx
"use client"
import * as React from 'react'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import AnnouncementList from './AnnouncementList'

interface ApprovalQueueProps {
  className?: string
}

export default function ApprovalQueue({ className }: ApprovalQueueProps) {
  const { announcements, loading, error, approve, reject } = useAnnouncements({
    status: 'pending_approval',
  })

  if (loading) {
    return <div className="text-center py-8 text-slate-400">Loading pending approvals...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-400">{error}</div>
  }

  if (announcements.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <div className="flex justify-center mb-2">
          <img src="/icons/check.svg" alt="Done" className="w-8 h-8 invert opacity-40" />
        </div>
        <p className="font-medium">No pending approvals</p>
        <p className="text-sm text-slate-500 mt-1">All caught up!</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <AnnouncementList
        announcements={announcements}
        onApprove={approve}
        onReject={reject}
        showActions={true}
      />
    </div>
  )
}
