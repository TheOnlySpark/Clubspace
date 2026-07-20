// src/app/api/clubs/[id]/members/search/route.ts
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-helpers'
import { adminClient } from '@/lib/supabase/admin'

// GET /api/clubs/[id]/members/search?q=john — Search university profiles to add as members
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { id: clubId } = params
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!clubId) {
      return NextResponse.json({ error: 'Club ID is required' }, { status: 400 })
    }

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] }, { status: 200 })
    }

    // Get the club's university_id
    const { data: club, error: clubError } = await adminClient
      .from('clubs')
      .select('university_id')
      .eq('id', clubId)
      .single()

    if (clubError || !club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 })
    }

    // Get existing member IDs for this club
    const { data: existingMembers } = await adminClient
      .from('club_memberships')
      .select('user_id')
      .eq('club_id', clubId)

    const existingMemberIds = (existingMembers || []).map((m: any) => m.user_id)

    // Search profiles in the same university, excluding existing members
    const searchTerm = `%${query}%`

    const { data: profiles, error: profileError } = await adminClient
      .from('profiles')
      .select('id, first_name, last_name, email, avatar_url, student_number')
      .eq('university_id', club.university_id)
      .eq('active', true)
      .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},student_number.ilike.${searchTerm}`)
      .limit(10)

    if (profileError) {
      console.error('Error searching profiles:', profileError)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    // Filter out existing members client-side
    const filteredProfiles = (profiles || []).filter(
      (p: any) => !existingMemberIds.includes(p.id)
    )

    return NextResponse.json({ users: filteredProfiles }, { status: 200 })
  } catch (error: any) {
    console.error('Error in GET /api/clubs/[id]/members/search:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
