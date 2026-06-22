// src/app/api/clubs/[id]/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-helpers'
import { createClient } from '@/lib/supabase/server'
import { clubSchema } from '@/lib/validations/clubs'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) {
      return auth.error
    }

    const { supabase } = auth
    const { id: clubId } = params

    if (!clubId) {
      return NextResponse.json(
        { error: 'Club ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('clubs')
      .select(`
        *,
        universities!inner(name),
        departments!inner(name)
      `)
      .eq('id', clubId)
      .single()

    if (error) {
      console.error('Error fetching club:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Club not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to fetch club' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('Error in GET /api/clubs/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) {
      return auth.error
    }

    const { supabase } = auth
    const { id: clubId } = params

    if (!clubId) {
      return NextResponse.json(
        { error: 'Club ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    // Partial update - we'll allow updating any field except id, university_id, etc.
    const parsed = clubSchema.partial().parse(body)

    // Verify the user has permission to update this club
    // They must be a member of the club and have role admin or officer, or be a university admin or super admin
    const { data: clubData, error: clubError } = await supabase
      .from('clubs')
      .select('university_id')
      .eq('id', clubId)
      .single()

    if (clubError || !clubData) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      )
    }

    // Get the user's profile to get their university_id and id
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('university_id, id')
      .eq('id', auth.session.user.id)
      .single()

    if (profileError || !profileData) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 400 }
      )
    }

    const userId = profileData.id
    const userUniversityId = profileData.university_id

    // Check if the user is a member of the club
    const { data: membershipData, error: membershipError } = await supabase
      .from('club_memberships')
      .select('role')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .single()

    if (membershipError) {
      // If no membership found, the user is not a member of the club
      return NextResponse.json(
        { error: 'You are not a member of this club' },
        { status: 403 }
      )
    }

    const isClubAdminOrOfficer = membershipData?.role === 'admin' || membershipData?.role === 'officer'

    // Check if the user is a university admin or super admin for the club's university
    const { data: userRoleData, error: userRoleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('university_id', clubData.university_id)
      .single()

    const isUniversityAdmin = userRoleData?.role === 'university_admin'
    const isSuperAdmin = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'super_admin')
      .then(({ data }) => (data?.length ?? 0) > 0)

    if (!(isClubAdminOrOfficer || isUniversityAdmin || isSuperAdmin)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to update this club' },
        { status: 403 }
      )
    }

    // Update the club
    const { data, error } = await supabase
      .from('clubs')
      .update(parsed)
      .eq('id', clubId)
      .select()
      .single()

    if (error) {
      console.error('Error updating club:', error)
      return NextResponse.json(
        { error: 'Failed to update club' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      )
    }
    console.error('Error in PATCH /api/clubs/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}