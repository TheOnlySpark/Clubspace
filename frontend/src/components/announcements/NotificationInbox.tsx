// src/components/announcements/NotificationInbox.tsx
"use client"
import * as React from 'react'
import { cn, formatDate } from '@/lib/utils'
import { useAnnouncements } from '@/hooks/useAnnouncements'

interface NotificationInboxProps {
  className?: string
}

export default function NotificationInbox({ className }: NotificationInboxProps) {
  const { announcements, loading, error, markAsRead } = useAnnouncements({
    status: 'published',
    limit: 10,
  })

  if (loading) {
    return <div className="text-center py-4 text-slate-400">Loading...</div>
  }

  if (error) {
    return <div className="text-center py-4 text-red-400">Error loading notifications</div>
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-slate-100">Recent Announcements</h2>
      </div>

      {announcements.length === 0 ? (
        <p className="text-slate-500 text-center py-8">No recent announcements</p>
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
              onClick={() => markAsRead(announcement.id)}
            >
              <div className="h-8 w-8 flex items-center justify-center bg-blue-600/20 text-blue-400 rounded-full shrink-0 text-sm">
                <img src="/icons/announcement.svg" alt="Announcement" className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-slate-200 truncate">{announcement.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{announcement.body}</p>
                <p className="text-xs text-slate-600 mt-1">{formatDate(announcement.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}