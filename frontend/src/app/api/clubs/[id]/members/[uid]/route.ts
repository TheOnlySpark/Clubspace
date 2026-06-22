// src/app/api/clubs/[id]/members/[uid]/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-helpers'
import { createClient } from '@/lib/supabase/server'
import { memberRoleSchema } from '@/lib/validations/members'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; uid: string } }
) {
  try {
    const { id: clubId, uid: userId } = params

    if (!clubId || !userId) {
      return NextResponse.json(
        { error: 'Club ID and User ID are required' },
        { status: 400 }
      )
    }

    // Get the session and check permissions
    const auth = await requireAuthForClub(clubId)
    if ('error' in auth) {
      return auth.error
    }

    // Parse and validate the request body
    const body = await request.json()
    const parsed = memberRoleSchema.parse(body)

    const { supabase } = auth

    // Update the user's role in the club_memberships table
    const { data, error } = await supabase
      .from('club_memberships')
      .update({ role: parsed.role })
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Membership not found' },
          { status: 404 }
        )
      }
      console.error('Error updating member role:', error)
      return NextResponse.json(
        { error: 'Failed to update member role' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Member role updated successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Validation error' },
        { status: 400 }
      )
    }
    console.error('Error in PATCH /api/clubs/[id]/members/[uid]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; uid: string } }
) {
  try {
    const { id: clubId, uid: userId } = params

    if (!clubId || !userId) {
      return NextResponse.json(
        { error: 'Club ID and User ID are required' },
        { status: 400 }
      )
    }

    // Get the session and check permissions
    const auth = await requireAuthForClub(clubId)
    if ('error' in auth) {
      return auth.error
    }

    const { supabase } = auth

    // Delete the membership (this removes the user from the club)
    const { error } = await supabase
      .from('club_memberships')
      .delete()
      .eq('club_id', clubId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting membership:', error)
      return NextResponse.json(
        { error: 'Failed to remove member from club' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Member removed from club successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in DELETE /api/clubs/[id]/members/[uid]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to check if the user has permission to manage the club
// They must be a member of the club and have role admin or officer, or be a university admin or super admin
async function requireAuthForClub(clubId: string) {
  const auth = await requireAuth()
  if ('error' in auth) {
    return { error: auth.error }
  }

  const { session, supabase } = auth

  // Get the user's role in the club
  const { data: membershipData, error: membershipError } = await supabase
    .from('club_memberships')
    .select('role')
    .eq('club_id', clubId)
    .eq('user_id', session.user.id)
    .single()

  if (membershipError) {
    console.error('Error fetching membership:', membershipError)
    return {
      error: NextResponse.json(
        { error: 'Unauthorised' },
        { status: 401 }
      )
    }
  }

  if (!membershipData) {
    return {
      error: NextResponse.json(
        { error: 'You are not a member of this club' },
        { status: 403 }
      )
    }
  }

  const userRoleInClub = membershipData.role

  // Check if the user is an admin or officer in the club, or a university admin or super admin
  const isClubAdminOrOfficer = userRoleInClub === 'admin' || userRoleInClub === 'officer'

  // We also need to check if the user is a university admin or super admin (they can manage any club in their university)
  // For that, we need to get the user's university role and the club's university_id
  const { data: userRoleData, error: userRoleError } = await supabase
    .from('user_roles')
    .select('role, university_id')
    .eq('user_id', session.user.id)
    .single()

  if (userRoleError) {
    console.error('Error fetching user role:', userRoleError)
    return {
      error: NextResponse.json(
        { error: 'Unauthorised' },
        { status: 401 }
      )
    }
  }

  const userGlobalRole = userRoleData?.role
  const userUniversityId = userRoleData?.university_id

  // Get the club's university_id
  const { data: clubData, error: clubError } = await supabase
    .from('clubs')
    .select('university_id')
    .eq('id', clubId)
    .single()

  if (clubError) {
    console.error('Error fetching club:', clubError)
    return {
      error: NextResponse.json(
        { error: 'Unauthorised' },
        { status: 401 }
      )
    }
  }

  const clubUniversityId = clubData?.university_id

  const isUniversityAdmin = userGlobalRole === 'university_admin' && userUniversityId === clubUniversityId
  const isSuperAdmin = userGlobalRole === 'super_admin'

  if (!(isClubAdminOrOfficer || isUniversityAdmin || isSuperAdmin)) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to manage this club' },
        { status: 403 }
      )
    }
  }

  return { session, supabase }
}