// src/components/members/RoleSelector.tsx
"use client"
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Dropdown, DropdownTrigger, DropdownContent } from '@/components/ui/Dropdown'
import Button from '@/components/ui/Button'

type Role = 'member' | 'officer' | 'club_admin' | 'university_admin' | 'super_admin'

interface RoleSelectorProps {
  currentRole: Role
  onRoleChange: (newRole: Role) => void
  disabled?: boolean
  className?: string
}

export default function RoleSelector({
  currentRole,
  onRoleChange,
  disabled = false,
  className,
}: RoleSelectorProps) {
  const [open, setOpen] = React.useState(false)

  const roles: Role[] = [
    'member',
    'officer',
    'club_admin',
    'university_admin',
    'super_admin',
  ]

  // Determine which roles are allowed to be selected based on the current user's role
  // This should be passed from the parent, but for now we'll allow all and let the API handle permissions
  // We'll just show all roles and disable the ones that are not allowed to be assigned by the current user.
  // However, we don't have the current user's role in this component.
  // We'll assume the parent will only pass roles that are allowed to be assigned.
  // For simplicity, we'll show all roles and let the API handle errors.

  const handleSelect = (role: Role) => {
    if (role !== currentRole && !disabled) {
      onRoleChange(role)
      setOpen(false)
    }
  }

  return (
    <Dropdown className={cn('relative inline-block', className)}>
      <DropdownTrigger
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-md shadow-sm text-left text-foreground',
          disabled && 'opacity-50',
          !disabled && 'hover:bg-gray-50'
        )}
      >
        <span className="text-left flex-1">
          {/* Map role to display name */}
          {(() => {
            switch (currentRole) {
              case 'member': return 'Member'
              case 'officer': return 'Officer'
              case 'club_admin': return 'Club Admin'
              case 'university_admin': return 'University Admin'
              case 'super_admin': return 'Super Admin'
              default: return 'Member'
            }
          })()}
        </span>
        <span className="ml-2 h-5 w-5">
          {/* Dropdown icon */}
          {!open ? '▾' : '▴'}
        </span>
      </DropdownTrigger>
      <DropdownContent className="w-48 mt-2 z-50">
        {roles.map((role) => (
          <Button
            key={role}
            variant="ghost"
            size="sm"
            className={cn(
              'w-full text-left',
              role === currentRole && 'font-medium text-primary',
              disabled && 'opacity-50'
            )}
            onClick={() => handleSelect(role)}
            disabled={disabled}
          >
            {/* Map role to display name */}
            {(() => {
              switch (role) {
                case 'member': return 'Member'
                case 'officer': return 'Officer'
                case 'club_admin': return 'Club Admin'
                case 'university_admin': return 'University Admin'
                case 'super_admin': return 'Super Admin'
                default: return 'Member'
              }
            })()}
          </Button>
        ))}
      </DropdownContent>
    </Dropdown>
  )
}