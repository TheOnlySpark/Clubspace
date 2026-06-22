// src/components/invites/InviteGenerator.tsx
"use client"
import * as React from 'react'
import { useState } from 'react'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

// We'll create a schema for the invite link generation
const inviteGeneratorSchema = z.object({
  expires_at: z.string().datetime().optional(), // ISO string
  max_uses: z.number().int().nonnegative().optional(),
})

interface InviteGeneratorProps {
  clubId: string
  onInviteCreated: (invite: any) => void
  className?: string
}

export default function InviteGenerator({
  clubId,
  onInviteCreated,
  className,
}: InviteGeneratorProps) {
  const [expiresAt, setExpiresAt] = useState<string>('')
  const [maxUses, setMaxUses] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      const parsed = inviteGeneratorSchema.parse({
        expires_at: expiresAt || undefined,
        max_uses: maxUses === '' ? undefined : Number(maxUses),
      })

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('User not authenticated')
      }

      // Generate a token for the invite link
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

      // Insert the invite link into the database
      const { data: newInvite, error: insertError } = await supabase
        .from('invite_links')
        .insert({
          club_id: clubId,
          token,
          expires_at: parsed.expires_at || null,
          max_uses: parsed.max_uses || null,
          use_count: 0,
          revoked: false,
          created_by: session.user.id,
        })
        .select()
        .single()

      if (insertError || !newInvite) {
        throw insertError || new Error('Failed to create invite link')
      }

      setSuccess('Invite link generated successfully!')
      setExpiresAt('')
      setMaxUses('')

      // Call the callback with the new invite
      onInviteCreated(newInvite)
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message)
      } else {
        setError(err.message ?? 'An unexpected error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <div>
        <label htmlFor="expiresAt" className="mb-2 block text-sm font-medium text-muted-foreground">
          Expires at (optional)
        </label>
        <Input
          id="expiresAt"
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className={cn('w-full', error ? 'border-destructive' : '')}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <div>
        <label htmlFor="maxUses" className="mb-2 block text-sm font-medium text-muted-foreground">
          Max uses (optional, leave blank for unlimited)
        </label>
        <Input
          id="maxUses"
          type="number"
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value)}
          className={cn('w-full', error ? 'border-destructive' : '')}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {success && (
        <p className="text-sm text-success">{success}</p>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Generating...' : 'Generate Invite Link'}
      </Button>
    </form>
  )
}