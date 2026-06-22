// src/components/layout/Sidebar.tsx
"use client"
import React from 'react'
import { cn } from '@/lib/utils'
import { useRole } from '@/hooks/useRole'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  className?: string
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, ...props }, ref) => {
    const { role, isClubAdmin, isUniversityAdmin, isSuperAdmin } = useRole()
    const pathname = usePathname()

    const navItems = [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
        available: () => true,
      },
      {
        title: 'Clubs',
        href: '/dashboard/clubs',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
        available: () => true,
      },
      {
        title: 'Events',
        href: '/dashboard/events',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
        available: () => true,
      },
      {
        title: 'Announcements',
        href: '/dashboard/announcements',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        ),
        available: () => true,
      },
      {
        title: 'Members',
        href: '/dashboard/members',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        ),
        available: () => true,
      },
      ...(isClubAdmin || isUniversityAdmin || isSuperAdmin
        ? [
          {
            title: 'Settings',
            href: '/dashboard/settings',
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ),
            available: () => isClubAdmin || isUniversityAdmin || isSuperAdmin,
          },
        ]
        : []),
      ...(isUniversityAdmin || isSuperAdmin
        ? [
          {
            title: 'Admin',
            href: '/dashboard/admin',
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            ),
            available: () => isUniversityAdmin || isSuperAdmin,
          },
        ]
        : []),
      ...(isSuperAdmin
        ? [
          {
            title: 'Super Admin',
            href: '/dashboard/superadmin',
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            ),
            available: () => isSuperAdmin,
          }
        ]
        : []),
    ]

    return (
      <aside
        ref={ref}
        className={cn(
          'flex h-full flex-col w-64 glass-panel border-r border-white/10',
          className
        )}
        {...props}
      >
        <div className="flex h-16 items-center px-6 border-b border-white/5">
          <h2 className="text-xl font-bold text-gradient">ClubSpace</h2>
        </div>
        <nav className="flex-1 overflow-y-auto mt-4">
          <ul className="space-y-2 px-3">
            {navItems
              .filter((item) => item.available())
              .map((item, index) => {
                const isActive = pathname === item.href
                return (
                  <li key={index}>
                    <a
                      href={item.href}
                      className={cn(
                        'flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                        isActive 
                          ? 'bg-primary/20 text-primary-foreground border border-primary/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                          : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                      )}
                    >
                      <span className={cn("mr-3", isActive ? "text-primary-foreground" : "text-muted-foreground")}>{item.icon}</span>
                      {item.title}
                    </a>
                  </li>
                )
              })}
          </ul>
        </nav>
        <div className="flex h-[72px] items-center px-4 mt-auto border-t border-white/5 bg-white/5 backdrop-blur-md">
          <div 
            onClick={async () => {
              const supabase = createClient()
              await supabase.auth.signOut()
              window.location.href = '/auth/login'
            }}
            className="flex items-center space-x-3 w-full p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group"
          >
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              U
            </div>
            <div className="space-y-0.5 overflow-hidden flex-1">
              <p className="text-sm font-semibold text-foreground truncate group-hover:text-red-400 transition-colors">Sign Out</p>
              <p className="text-xs text-primary/80 truncate capitalize">{role ? role.replace('_', ' ') : 'Loading...'}</p>
            </div>
            <svg className="w-5 h-5 text-muted-foreground group-hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
        </div>
      </aside>
    )
  }
)
Sidebar.displayName = 'Sidebar'

export default Sidebar