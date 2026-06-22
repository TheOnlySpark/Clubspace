"use client"
import React from 'react'
import { cn } from '@/lib/utils'
import NotificationBell from './NotificationBell'

interface NavbarProps {
  className?: string
}

const Navbar = React.forwardRef<HTMLDivElement, NavbarProps>(
  ({ className, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          'flex h-16 items-center justify-between px-4 border-b bg-white',
          className
        )}
        {...props}
      >
        <div className="flex items-center space-x-4">
          {/* Left side: brand or app name */}
          <h1 className="text-lg font-semibold text-primary">ClubSpace</h1>
          {/* Page title could be dynamic */}
          <h2 className="text-sm font-medium text-muted-foreground">Dashboard</h2>
        </div>
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <NotificationBell />
          {/* User menu placeholder */}
          <div className="relative">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-md bg-muted hover:bg-muted/80"
              aria-label="User menu"
            >
              {/* User avatar placeholder */}
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                U
              </div>
            </button>
            {/* Dropdown menu for user - we would use Dropdown from ui */}
          </div>
        </div>
      </header>
    )
  }
)
Navbar.displayName = 'Navbar'

export default Navbar