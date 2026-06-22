// src/components/layout/Sidebar.tsx
"use client"
import React from 'react'
import { cn } from '@/lib/utils'
import { useRole } from '@/hooks/useRole'

interface SidebarProps {
  className?: string
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, ...props }, ref) => {
    const { role, isClubAdmin, isUniversityAdmin, isSuperAdmin } = useRole()

    // Define navigation items based on role
    const navItems = [
      // Common items for all authenticated users
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: 'Home',
        available: () => true,
      },
      {
        title: 'Clubs',
        href: '/dashboard/clubs',
        icon: 'Users',
        available: () => true,
      },
      {
        title: 'Events',
        href: '/dashboard/events',
        icon: 'Calendar',
        available: () => true,
      },
      {
        title: 'Announcements',
        href: '/dashboard/announcements',
        icon: 'Megaphone',
        available: () => true,
      },
      {
        title: 'Members',
        href: '/dashboard/members',
        icon: 'UserPlus',
        available: () => true,
      },
      // Role-specific items
      ...(isClubAdmin || isUniversityAdmin || isSuperAdmin
        ? [
          {
            title: 'Settings',
            href: '/dashboard/settings',
            icon: 'Settings',
            available: () => isClubAdmin || isUniversityAdmin || isSuperAdmin,
          },
        ]
        : []),
      ...(isUniversityAdmin || isSuperAdmin
        ? [
          {
            title: 'Admin',
            href: '/dashboard/admin',
            icon: 'Shield',
            available: () => isUniversityAdmin || isSuperAdmin,
          },
        ]
        : []),
      ...(isSuperAdmin
        ? [
          {
            title: 'Super Admin',
            href: '/dashboard/superadmin',
            icon: 'Crown',
            available: () => isSuperAdmin,
          }
        ]
        : []),
    ]

    return (
      <aside
        ref={ref}
        className={cn(
          'flex h-full flex-col w-64 bg-white border-r',
          className
        )}
        {...props}
      >
        <div className="flex h-16 items-center px-4 border-b">
          <h2 className="text-lg font-semibold text-primary">ClubSpace</h2>
        </div>
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-1 px-2 pt-2">
            {navItems
              .filter((item) => item.available())
              .map((item, index) => (
                <li key={index}>
                  <a
                    href={item.href}
                    className={cn(
                      'flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      'aria-current' // we could add active link detection later
                    )}
                  >
                    {/* Placeholder for icon - we would use lucide-react or similar */}
                    <span className="mr-3 h-4 w-4">{item.icon}</span>
                    {item.title}
                  </a>
                </li>
              ))}
          </ul>
        </nav>
        <div className="flex h-16 items-center px-4 pt-4 border-t">
          {/* User avatar and name would go here */}
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-muted">
              {/* Avatar placeholder */}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">User Name</p>
              <p className="text-xs text-muted-foreground">{role}</p>
            </div>
          </div>
        </div>
      </aside>
    )
  }
)
Sidebar.displayName = 'Sidebar'

export default Sidebar