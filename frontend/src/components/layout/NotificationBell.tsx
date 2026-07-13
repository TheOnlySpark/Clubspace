// src/components/layout/NotificationBell.tsx
"use client"
import * as React from 'react'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/hooks/useNotifications'

interface NotificationBellProps {
  className?: string
}

const NotificationBell = React.forwardRef<HTMLDivElement, NotificationBellProps>(
  ({ className, ...props }, ref) => {
    const { unreadCount, refetch } = useNotifications()

    // Poll for updates every 60 seconds
    React.useEffect(() => {
      const interval = setInterval(() => {
        refetch()
      }, 60_000)
      return () => clearInterval(interval)
    }, [refetch])

    return (
      <div
        ref={ref}
        className={cn('relative', className)}
        {...props}
      >
        <button
          onClick={() => {
            refetch()
            // Future: toggle notifications panel
            alert("Notification panel coming soon!")
          }}
          className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-800 transition-colors"
          aria-label="Notifications"
        >
          <svg className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-900">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    )
  }
)
NotificationBell.displayName = 'NotificationBell'

export default NotificationBell