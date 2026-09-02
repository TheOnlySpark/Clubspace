// src/components/layout/Navbar.tsx
"use client"
import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface NavbarProps {
  className?: string
}

const Navbar = React.forwardRef<HTMLDivElement, NavbarProps>(
  ({ className, ...props }, ref) => {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const supabase = createClient()
    const { user } = useAuth()

    const userInitial = user?.user_metadata?.full_name?.charAt(0) 
      || user?.user_metadata?.name?.charAt(0)
      || user?.email?.charAt(0)?.toUpperCase() 
      || 'U';

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
          'flex h-16 items-center justify-between px-6 border-b border-slate-200 bg-white z-50 sticky top-0',
          className
        )}
        {...props}
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 md:hidden">
            <img src="/logo.png" alt="Campus Crew Logo" className="w-8 h-8 object-contain mix-blend-multiply" />
            <h1 className="text-lg font-bold text-slate-900">Campus Crew</h1>
          </div>
          <h2 className="hidden md:block text-sm font-medium text-slate-600 px-3 py-1 rounded-full bg-slate-50 border border-slate-200">Overview</h2>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
              aria-label="User menu"
            >
              <div className="text-sm font-semibold text-indigo-700 uppercase">
                {userInitial}
              </div>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-slate-200 shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={() => { setIsUserMenuOpen(false); router.push('/dashboard/settings') }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Settings
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 transition-colors font-medium"
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