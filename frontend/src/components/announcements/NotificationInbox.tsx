// src/components/announcements/NotificationInbox.tsx
"use client"
import * as React from 'react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import { useNotifications } from '@/hooks/useNotifications'

interface NotificationInboxProps {
  className?: string
}

export default function NotificationInbox({ className }: NotificationInboxProps) {
  const { notifications, unreadCount, loading, error, markAsRead, markAllAsRead } = useNotifications()

  if (loading) {
    return <div className="text-center py-4">Loading notifications...</div>
  }

  if (error) {
    return <div className="text-center py-4 text-destructive">Error loading notifications</div>
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-primary">Notifications</h2>
        <div className="flex items-center space-x-2">
          <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
            {unreadCount}
          </span>
          <button
            onClick={markAllAsRead}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Mark all as read
          </button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No notifications</p>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                'flex items-start space-x-4 p-4 border rounded-lg shadow-sm',
                notification.read ? 'bg-white' : 'bg-blue-50',
                'hover:bg-blue-100 transition-colors duration-200'
              )}
              onClick={() => markAsRead(notification.id)}
            >
              {/* Placeholder for notification icon */}
              <div className="h-8 w-8 flex items-center justify-center bg-primary text-primary-foreground rounded-full">
                🔔
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-primary">{notification.announcement?.title || 'Announcement'}</h3>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(notification.created_at)}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {notification.announcement?.body || 'No announcement details'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}