// src/app/api/invites/resolve/route.ts
import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Resolve the token to get the invite link and club details
    const { data: invite, error } = await adminClient
      .from('invite_links')
      .select(`
        id,
        club_id,
        token,
        expires_at,
        max_uses,
        use_count,
        revoked,
        clubs (
          id,
          name,
          banner_url,
          privacy
        )
      `)
      .eq('token', token)
      .single()

    if (error || !invite) {
      console.error('Error resolving invite:', error)
      return NextResponse.json(
        { error: 'Invalid or expired invite link' },
        { status: 404 }
      )
    }

    // Check if revoked
    if (invite.revoked) {
      return NextResponse.json(
        { error: 'This invite link has been revoked' },
        { status: 403 }
      )
    }

    // Check if expired
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This invite link has expired' },
        { status: 403 }
      )
    }

    // Check max uses
    if (invite.max_uses !== null && invite.use_count >= invite.max_uses) {
      return NextResponse.json(
        { error: 'This invite link has reached its maximum number of uses' },
        { status: 403 }
      )
    }

    return NextResponse.json({ invite }, { status: 200 })
  } catch (error: any) {
    console.error('Error in GET /api/invites/resolve:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
