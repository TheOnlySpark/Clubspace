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
          className="flex h-10 w-10 items-center justify-center rounded-md bg-muted hover:bg-muted/80"
          aria-label="Notifications"
          onClick={refetch}
        >
          {/* Bell icon placeholder */}
          <div className="h-5 w-5">🛎️</div>
          {/* Badge for unread count */}
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium">
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