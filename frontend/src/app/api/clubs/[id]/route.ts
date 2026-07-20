export const dynamic = 'force-dynamic'
// src/app/api/clubs/[id]/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-helpers'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
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
    const parsed = clubSchema.partial().parse(body)

    const allowedUpdates: any = {}
    if ('name' in parsed) allowedUpdates.name = parsed.name
    if ('description' in parsed) allowedUpdates.description = parsed.description
    if ('privacy' in parsed) allowedUpdates.privacy = parsed.privacy
    if ('join_policy' in parsed) allowedUpdates.join_policy = parsed.join_policy
    if ('banner_url' in parsed) allowedUpdates.banner_url = parsed.banner_url

    // Verify the user has permission to update this club
    const { data: clubData, error: clubError } = await adminClient
      .from('clubs')
      .select('university_id')
      .eq('id', clubId)
      .single()

    if (clubError || !clubData) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 })
    }

    const { data: profileData, error: profileError } = await adminClient
      .from('profiles')
      .select('university_id, id')
      .eq('id', auth.session.user.id)
      .single()

    if (profileError || !profileData) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 400 })
    }

    const userId = profileData.id
    const userUniversityId = profileData.university_id

    // Check if the user is a member of the club
    const { data: membershipData } = await adminClient
      .from('club_memberships')
      .select('role')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .single()

    const isClubAdminOrOfficer = membershipData?.role === 'admin' || membershipData?.role === 'officer'

    // Check if the user is a university admin or super admin for the club's university
    const { data: userRoleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('university_id', clubData.university_id)
      .single()

    const isUniversityAdmin = userRoleData?.role === 'university_admin'
    
    // Super admin role might not be tied to a specific university_id, so check generally
    const { data: superAdminRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'super_admin')
      .single()
      
    const isSuperAdmin = !!superAdminRole

    if (!(isClubAdminOrOfficer || isUniversityAdmin || isSuperAdmin)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to update this club' },
        { status: 403 }
      )
    }

    // Update the club using adminClient to bypass RLS since University Admins might not be members
    const { data, error } = await adminClient
      .from('clubs')
      .update(allowedUpdates)
      .eq('id', clubId)
      .select()
      .single()

    if (error) {
      console.error('Error updating club:', error)
      return NextResponse.json({ error: 'Failed to update club' }, { status: 500 })
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    // Only Super Admin can hard delete a club
    const { data: superAdminRole } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', auth.session.user.id)
      .eq('role', 'super_admin')
      .single()

    if (!superAdminRole) {
      return NextResponse.json({ error: 'Forbidden: Only Super Admins can hard delete clubs' }, { status: 403 })
    }

    // Hard delete using adminClient
    const { error } = await adminClient
      .from('clubs')
      .delete()
      .eq('id', clubId)

    if (error) {
      console.error('Error deleting club:', error)
      return NextResponse.json({ error: 'Failed to delete club' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Club deleted successfully' }, { status: 200 })
  } catch (error: any) {
    console.error('Error in DELETE /api/clubs/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}