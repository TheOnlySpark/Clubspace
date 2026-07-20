// src/app/api/invites/accept/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-helpers'
import { adminClient } from '@/lib/supabase/admin'

const acceptInviteSchema = z.object({
  token: z.string(),
})

export async function POST(request: Request) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) {
      return auth.error
    }

    const userId = auth.session.user.id

    const body = await request.json()
    const parsed = acceptInviteSchema.parse(body)
    const { token } = parsed

    // 1. Resolve and validate the token using adminClient
    const { data: invite, error } = await adminClient
      .from('invite_links')
      .select('id, club_id, expires_at, max_uses, use_count, revoked')
      .eq('token', token)
      .single()

    if (error || !invite) {
      console.error('Error finding invite for accept:', error)
      return NextResponse.json(
        { error: 'Invalid or expired invite link' },
        { status: 404 }
      )
    }

    if (invite.revoked) {
      return NextResponse.json(
        { error: 'This invite link has been revoked' },
        { status: 403 }
      )
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This invite link has expired' },
        { status: 403 }
      )
    }

    if (invite.max_uses !== null && invite.use_count >= invite.max_uses) {
      return NextResponse.json(
        { error: 'This invite link has reached its maximum number of uses' },
        { status: 403 }
      )
    }

    // 2. Check if the user is already a member
    const { data: existingMembership } = await adminClient
      .from('club_memberships')
      .select('id')
      .eq('club_id', invite.club_id)
      .eq('user_id', userId)
      .single()

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already a member of this club' },
        { status: 409 }
      )
    }

    // 3. Add the user to the club
    const { error: insertError } = await adminClient
      .from('club_memberships')
      .insert({
        club_id: invite.club_id,
        user_id: userId,
        role: 'member',
      })

    if (insertError) {
      console.error('Error inserting club membership from invite:', insertError)
      return NextResponse.json(
        { error: 'Failed to join the club' },
        { status: 500 }
      )
    }

    // 4. Increment the use_count of the invite link
    const { error: updateError } = await adminClient
      .from('invite_links')
      .update({ use_count: invite.use_count + 1 })
      .eq('id', invite.id)

    if (updateError) {
      console.error('Error incrementing invite use_count:', updateError)
      // Non-fatal, we can still return success
    }

    return NextResponse.json(
      { message: 'Successfully joined the club', club_id: invite.club_id },
      { status: 200 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Validation error' },
        { status: 400 }
      )
    }
    console.error('Error in POST /api/invites/accept:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
