// src/components/announcements/AnnouncementList.tsx
"use client"
import * as React from 'react'
import { cn, formatDate } from '@/lib/utils'
import { useRole } from '@/hooks/useRole'
import type { Announcement } from '@/types'

interface AnnouncementListProps {
  announcements: Announcement[]
  onDelete?: (id: string) => Promise<void>
  onPin?: (id: string) => Promise<void>
  onApprove?: (id: string) => Promise<void>
  onReject?: (id: string, reason?: string) => Promise<void>
  onSubmit?: (id: string) => Promise<void>
  onRead?: (id: string) => Promise<void>
  className?: string
  showActions?: boolean
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-700 text-slate-300',
  pending_approval: 'bg-amber-900/40 text-amber-300',
  published: 'bg-emerald-900/40 text-emerald-300',
  archived: 'bg-slate-700/50 text-slate-400',
  rejected: 'bg-red-900/40 text-red-300',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  published: 'Published',
  archived: 'Archived',
  rejected: 'Rejected',
}

export default function AnnouncementList({
  announcements,
  onDelete,
  onPin,
  onApprove,
  onReject,
  onSubmit,
  onRead,
  className,
  showActions = true,
}: AnnouncementListProps) {
  const { isAdmin, isClubAdmin, isUniversityAdmin, isSuperAdmin } = useRole()
  const [rejectingId, setRejectingId] = React.useState<string | null>(null)
  const [rejectReason, setRejectReason] = React.useState('')

  if (announcements.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <div className="text-4xl mb-3">📭</div>
        <p className="text-lg font-medium">No announcements yet</p>
        <p className="text-sm text-slate-500 mt-1">Create one to get started</p>
      </div>
    )
  }

  const handleReject = async (id: string) => {
    if (onReject) {
      await onReject(id, rejectReason)
      setRejectingId(null)
      setRejectReason('')
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {announcements.map((announcement) => (
        <div
          key={announcement.id}
          className={cn(
            'rounded-xl border border-slate-700 bg-slate-800 p-5 transition-all duration-200 hover:border-slate-600',
            announcement.pinned && 'border-blue-600/50 bg-slate-800/90 ring-1 ring-blue-600/20'
          )}
          onClick={() => onRead?.(announcement.id)}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              {announcement.pinned && (
                <span className="text-xs bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded-full font-medium">
                  📌 Pinned
                </span>
              )}
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_STYLES[announcement.status])}>
                {STATUS_LABELS[announcement.status]}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 capitalize">
                {announcement.visibility}
              </span>
            </div>
          </div>

          {/* Title & Body */}
          <h3 className="text-lg font-semibold text-slate-100 mb-2">{announcement.title}</h3>
          <p className="text-sm text-slate-400 line-clamp-3 mb-4 whitespace-pre-wrap">{announcement.body}</p>

          {/* Rejection reason */}
          {announcement.status === 'rejected' && announcement.rejection_reason && (
            <div className="mb-4 rounded-lg bg-red-900/20 border border-red-800/50 px-3 py-2 text-sm text-red-300">
              <span className="font-medium">Rejection reason:</span> {announcement.rejection_reason}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-700">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              {announcement.club_name && <span>🏛️ {announcement.club_name}</span>}
              <span>👤 {announcement.author_name || 'Unknown'}</span>
              <span>📅 {formatDate(announcement.created_at)}</span>
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex items-center gap-2">
                {/* Submit for approval (author's own drafts) */}
                {announcement.status === 'draft' && onSubmit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onSubmit(announcement.id) }}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    Submit
                  </button>
                )}

                {/* Approve/Reject (admin only, pending items) */}
                {announcement.status === 'pending_approval' && isAdmin() && onApprove && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); onApprove(announcement.id) }}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setRejectingId(announcement.id) }}
                      className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}

                {/* Pin toggle */}
                {announcement.status === 'published' && isAdmin() && onPin && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onPin(announcement.id) }}
                    className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
                  >
                    {announcement.pinned ? 'Unpin' : 'Pin'}
                  </button>
                )}

                {/* Delete */}
                {isAdmin() && onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(announcement.id) }}
                    className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Reject reason inline form */}
          {rejectingId === announcement.id && (
            <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Rejection reason (optional)"
                className="flex-1 rounded-lg border bg-slate-900 border-slate-700 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <button
                onClick={() => handleReject(announcement.id)}
                className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-500 transition-colors font-medium"
              >
                Confirm
              </button>
              <button
                onClick={() => { setRejectingId(null); setRejectReason('') }}
                className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}