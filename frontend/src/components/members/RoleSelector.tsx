// src/components/members/RoleSelector.tsx
"use client"
import * as React from 'react'
import { cn } from '@/lib/utils'
import { Dropdown, DropdownTrigger, DropdownContent } from '@/components/ui/Dropdown'
import Button from '@/components/ui/Button'

type Role = 'member' | 'officer' | 'club_admin' | 'university_admin' | 'super_admin'

const ROLE_DISPLAY_NAMES: Record<Role, string> = {
  member: 'Member',
  officer: 'Officer',
  club_admin: 'Club Admin',
  university_admin: 'University Admin',
  super_admin: 'Super Admin',
}

interface RoleSelectorProps {
  currentRole: Role
  onRoleChange: (newRole: Role) => void
  disabled?: boolean
  className?: string
  isSuperAdmin?: boolean
}

export default function RoleSelector({
  currentRole,
  onRoleChange,
  disabled = false,
  className,
  isSuperAdmin = false,
}: RoleSelectorProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (role: Role) => {
    if (role !== currentRole && !disabled) {
      onRoleChange(role)
      setOpen(false)
    }
  }

  const assignableRoles: Role[] = isSuperAdmin
    ? ['member', 'officer', 'club_admin', 'university_admin']
    : ['member', 'officer', 'club_admin']

  return (
    <Dropdown className={cn('relative inline-block', className)}>
      <DropdownTrigger
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 bg-background border border-border rounded-md text-left text-foreground',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'hover:bg-accent hover:text-accent-foreground'
        )}
      >
        <span className="text-left flex-1">
          {ROLE_DISPLAY_NAMES[currentRole] || 'Member'}
        </span>
        <span className="ml-2 h-5 w-5">
          {!open ? '▾' : '▴'}
        </span>
      </DropdownTrigger>
      <DropdownContent className="w-48 mt-2 z-50">
        {assignableRoles.map((role) => (
          <Button
            key={role}
            variant="ghost"
            size="sm"
            className={cn(
              'w-full text-left',
              role === currentRole && 'font-medium text-primary',
            )}
            onClick={() => handleSelect(role)}
            disabled={disabled}
          >
            {ROLE_DISPLAY_NAMES[role]}
          </Button>
        ))}
      </DropdownContent>
    </Dropdown>
  )
}