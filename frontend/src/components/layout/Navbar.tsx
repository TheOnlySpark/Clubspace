// src/components/layout/Navbar.tsx
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
          'flex h-16 items-center justify-between px-6 border-b border-white/5 glass-panel z-50 sticky top-0',
          className
        )}
        {...props}
      >
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-bold text-gradient md:hidden">ClubSpace</h1>
          <h2 className="hidden md:block text-sm font-medium text-muted-foreground px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">Overview</h2>
        </div>
        <div className="flex items-center space-x-4">
          {/* Notification Bell */}
          <div className="hover:bg-white/10 rounded-full p-1 transition-colors">
             <NotificationBell />
          </div>
          {/* User menu placeholder */}
          <div className="relative">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              aria-label="User menu"
            >
              <div className="text-sm font-semibold text-white">
                U
              </div>
            </button>
          </div>
        </div>
      </header>
    )
  }
)
Navbar.displayName = 'Navbar'

export default Navbar