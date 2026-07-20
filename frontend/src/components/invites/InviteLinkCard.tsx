// src/components/invites/InviteLinkCard.tsx
"use client"
import * as React from 'react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'

interface InviteLinkCardProps {
  invite: {
    id: string
    token: string
    expires_at: string | null
    max_uses: number | null
    use_count: number
    revoked: boolean
    created_at: string
  }
  onRevoke: (inviteId: string) => Promise<void>
  onCopy: (token: string) => void
  className?: string
}

export default function InviteLinkCard({
  invite,
  onRevoke,
  onCopy,
  className,
}: InviteLinkCardProps) {
  const [copied, setCopied] = React.useState(false)

  const [origin, setOrigin] = React.useState('')

  React.useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const fullLink = origin ? `${origin}/invite/${invite.token}` : `/invite/${invite.token}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullLink)
      onCopy(invite.token)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      // TODO: show error toast
    }
  }

  const handleRevoke = async () => {
    try {
      await onRevoke(invite.id)
    } catch (err) {
      console.error('Failed to revoke invite:', err)
      // TODO: show error toast
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className={cn('border rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-200', className)}>
      <div className="flex items-start space-x-4">
        {/* Placeholder for invite icon */}
        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
          <img src="/icons/link.svg" alt="Link" className="w-5 h-5 invert opacity-70" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-primary">Invite Link</h3>
          <p className="mt-1 text-sm text-muted-foreground word-break-break-all">
            {fullLink}
          </p>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center">
              <span className="flex items-center justify-center mr-1"><img src="/icons/calendar.svg" alt="Calendar" className="w-4 h-4 invert opacity-70" /></span>
              <span>Created: {formatDate(invite.created_at)}</span>
            </div>
            <div className="flex items-center">
              <span className="flex items-center justify-center mr-1"><img src="/icons/clock.svg" alt="Clock" className="w-4 h-4 invert opacity-70" /></span>
              <span>Expires: {formatDate(invite.expires_at)}</span>
            </div>
            <div className="flex items-center">
              <span className="flex items-center justify-center mr-1"><img src="/icons/hash.svg" alt="Uses" className="w-4 h-4 invert opacity-70" /></span>
              <span>
                Uses: {invite.use_count}/{invite.max_uses ?? '∞'}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-end space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className={cn(copied ? 'text-primary' : 'text-muted-foreground')}
        >
          {copied ? 'Copied!' : 'Copy Link'}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleRevoke}
          className="hidden md:inline-block"
        >
          Revoke
        </Button>
      </div>
    </div>
  )
}