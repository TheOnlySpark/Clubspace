// src/components/layout/Navbar.tsx
"use client"
import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import NotificationBell from './NotificationBell'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface NavbarProps {
  className?: string
}

const Navbar = React.forwardRef<HTMLDivElement, NavbarProps>(
  ({ className, ...props }, ref) => {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setIsUserMenuOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSignOut = async () => {
      await supabase.auth.signOut()
      router.push('/auth/login')
      router.refresh()
    }

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
          <NotificationBell />
          
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              aria-label="User menu"
            >
              <div className="text-sm font-semibold text-white">
                U
              </div>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#1e293b] border border-white/10 shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={() => { setIsUserMenuOpen(false); router.push('/dashboard/settings') }}
                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-white/5 transition-colors"
                >
                  Settings
                </button>
                <div className="h-px bg-white/10 my-1" />
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors font-medium"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    )
  }
)
Navbar.displayName = 'Navbar'

export default Navbar