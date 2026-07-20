export const dynamic = 'force-dynamic'
// src/app/api/clubs/[id]/join/route.ts
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-helpers'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error
    
    const clubId = params.id
    const userId = auth.session.user.id
    const supabase = auth.supabase

    // 1. Fetch club to verify it's open
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('join_policy')
      .eq('id', clubId)
      .single()

    if (clubError || !club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 })
    }

    if (club.join_policy !== 'open') {
      return NextResponse.json({ error: 'This club requires an invite link or approval to join' }, { status: 403 })
    }

    // 2. Check if already a member
    const { data: existingMembership } = await adminClient
      .from('club_memberships')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingMembership) {
      return NextResponse.json({ error: 'You are already a member' }, { status: 409 })
    }

    // 3. Insert membership
    const { error: insertError } = await adminClient
      .from('club_memberships')
      .insert({
        club_id: clubId,
        user_id: userId,
        role: 'member',
      })

    if (insertError) {
      console.error('Error joining club directly:', insertError)
      return NextResponse.json({ error: 'Failed to join club: ' + insertError.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Successfully joined' }, { status: 200 })
  } catch (error: any) {
    console.error('Error in POST /api/clubs/[id]/join:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
