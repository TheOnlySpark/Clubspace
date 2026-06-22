// src/components/invites/InviteTable.tsx
"use client"
import * as React from 'react'
import { cn } from '@/lib/utils'
import InviteLinkCard from '@/components/invites/InviteLinkCard'

interface InviteTableProps {
  invites: Array<any>
  onRevoke: (inviteId: string) => Promise<void>
  onCopy: (token: string) => void
  className?: string
}

export default function InviteTable({
  invites,
  onRevoke,
  onCopy,
  className,
}: InviteTableProps) {
  if (invites.length === 0) {
    return <p className="text-muted-foreground">No invite links yet.</p>
  }

  return (
    <div className={cn('space-y-4', className)}>
      {invites.map((invite) => (
        <InviteLinkCard
          key={invite.id}
          invite={invite}
          onRevoke={onRevoke}
          onCopy={onCopy}
        />
      ))}
    </div>
  )
}