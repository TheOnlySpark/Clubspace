// src/components/announcements/AnnouncementList.tsx
"use client"
import * as React from 'react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'

interface AnnouncementListProps {
  announcements: Array<any>
  onDelete: (id: string) => Promise<void>
  className?: string
}

export default function AnnouncementList({
  announcements,
  onDelete,
  className,
}: AnnouncementListProps) {
  if (announcements.length === 0) {
    return <p className="text-muted-foreground">No announcements yet.</p>
  }

  return (
    <div className={cn('space-y-4', className)}>
      {announcements.map((announcement) => (
        <div key={announcement.id} className="border rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-start space-x-4">
            {/* Placeholder for announcement icon */}
            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
              📢
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary">{announcement.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
                {announcement.body}
              </p>
              <div className="mt-2 flex items-center space-x-4 text-xs text-muted-foreground">
                <span>📅</span>
                <span>{formatDate(announcement.created_at)}</span>
                <span>👤</span>
                <span>{announcement.sent_by?.split('@')[0] || 'Unknown'}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex justify-end space-x-3">
            {/* Delete button (only for admins) */}
            <button
              onClick={() => onDelete(announcement.id)}
              className="text-sm text-destructive hover:underline"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}