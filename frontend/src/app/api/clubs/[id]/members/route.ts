// src/app/api/clubs/[id]/members/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-helpers'
import { adminClient } from '@/lib/supabase/admin'

// GET /api/clubs/[id]/members — List all members of a club with profile data
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { id: clubId } = params

    if (!clubId) {
      return NextResponse.json({ error: 'Club ID is required' }, { status: 400 })
    }

    // Use adminClient to join memberships with profiles (bypassing RLS complexity)
    const { data, error } = await adminClient
      .from('club_memberships')
      .select(`
        id,
        role,
        joined_at,
        user_id,
        profiles!inner(
          id,
          first_name,
          last_name,
          email,
          avatar_url,
          student_number
        )
      `)
      .eq('club_id', clubId)
      .order('joined_at', { ascending: true })

    if (error) {
      console.error('Error fetching club members:', error)
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
    }

    // Flatten the response for easier consumption
    const members = (data || []).map((m: any) => ({
      membership_id: m.id,
      user_id: m.user_id,
      role: m.role,
      joined_at: m.joined_at,
      first_name: m.profiles.first_name,
      last_name: m.profiles.last_name,
      email: m.profiles.email,
      avatar_url: m.profiles.avatar_url,
      student_number: m.profiles.student_number,
    }))

    return NextResponse.json({ members }, { status: 200 })
  } catch (error: any) {
    console.error('Error in GET /api/clubs/[id]/members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/clubs/[id]/members — Add a member to the club
const addMemberSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  role: z.enum(['admin', 'officer', 'member']).default('member'),
})

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { id: clubId } = params
    const userId = auth.session.user.id

    if (!clubId) {
      return NextResponse.json({ error: 'Club ID is required' }, { status: 400 })
    }

    // Verify requester has permission (club admin/officer, university admin, or super admin)
    const hasPermission = await checkClubManagePermission(userId, clubId)
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to add members' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = addMemberSchema.parse(body)

    // Check if user is already a member
    const { data: existing } = await adminClient
      .from('club_memberships')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', parsed.user_id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'User is already a member of this club' },
        { status: 409 }
      )
    }

    // Add the member
    const { data, error } = await adminClient
      .from('club_memberships')
      .insert({
        club_id: clubId,
        user_id: parsed.user_id,
        role: parsed.role,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding member:', error)
      return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Validation error' },
        { status: 400 }
      )
    }
    console.error('Error in POST /api/clubs/[id]/members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper: Check if a user can manage a club's members
async function checkClubManagePermission(userId: string, clubId: string): Promise<boolean> {
  // Check club membership role
  const { data: membership } = await adminClient
    .from('club_memberships')
    .select('role')
    .eq('club_id', clubId)
    .eq('user_id', userId)
    .single()

  if (membership?.role === 'admin' || membership?.role === 'officer') {
    return true
  }

  // Check university/super admin role
  const { data: userRole } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)

  if (userRole?.some((r: any) => r.role === 'super_admin' || r.role === 'university_admin')) {
    return true
  }

  return false
}
