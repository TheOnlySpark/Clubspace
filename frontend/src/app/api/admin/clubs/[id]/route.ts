export const dynamic = 'force-dynamic'
// src/app/api/admin/clubs/[id]/route.ts
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

    // Get the club
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('*')
      .eq('id', clubId)
      .single()

    if (clubError) {
      if (clubError.code === 'PGRST116') {
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

    // Get the user's profile to get university_id and check permissions
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

    const isSuperAdmin = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', auth.session.user.id)
      .eq('role', 'super_admin')
      .then(({ data }) => (data?.length ?? 0) > 0)

    // Allow if super admin or if club belongs to user's university and user is university admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', auth.session.user.id)
      .eq('university_id', club.university_id)
      .single()

    const isUniversityAdmin = roleData?.role === 'university_admin'

    if (!isSuperAdmin && !isUniversityAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to view this club' },
        { status: 403 }
      )
    }

    // Additionally, if not super admin, ensure the club belongs to the user's university
    if (!isSuperAdmin && profileData.university_id !== club.university_id) {
      return NextResponse.json(
        { error: 'Forbidden: Club belongs to a different university' },
        { status: 403 }
      )
    }

    return NextResponse.json(club, { status: 200 })
  } catch (error: any) {
    console.error('Error in GET /api/admin/clubs/[id]:', error)
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

    // Get the club to check ownership
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

    // Get the user's profile to get university_id and check permissions
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

    const isSuperAdmin = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', auth.session.user.id)
      .eq('role', 'super_admin')
      .then(({ data }) => (data?.length ?? 0) > 0)

    // Allow if super admin or if club belongs to user's university and user is university admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', auth.session.user.id)
      .eq('university_id', clubData.university_id)
      .single()

    const isUniversityAdmin = roleData?.role === 'university_admin'

    if (!isSuperAdmin && !isUniversityAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to update this club' },
        { status: 403 }
      )
    }

    // Additionally, if not super admin, ensure we are not trying to change university_id
    if (!isSuperAdmin && parsed.university_id && parsed.university_id !== clubData.university_id) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot change university of a club' },
        { status: 403 }
      )
    }

    // If super admin is changing university_id, verify the target university exists
    if (isSuperAdmin && parsed.university_id) {
      const { data: uniData, error: uniError } = await supabase
        .from('universities')
        .select('id')
        .eq('id', parsed.university_id)
        .single()
      if (uniError || !uniData) {
        return NextResponse.json(
          { error: 'Invalid university ID' },
          { status: 400 }
        )
      }
    }

    // Update the club
    const { data, error } = await supabase
      .from('clubs')
      .update(allowedUpdates)
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
    console.error('Error in PATCH /api/admin/clubs/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Get the club to check ownership
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

    // Get the user's profile to get university_id and check permissions
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

    const isSuperAdmin = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', auth.session.user.id)
      .eq('role', 'super_admin')
      .then(({ data }) => (data?.length ?? 0) > 0)

    // Allow if super admin or if club belongs to user's university and user is university admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', auth.session.user.id)
      .eq('university_id', clubData.university_id)
      .single()

    const isUniversityAdmin = roleData?.role === 'university_admin'

    if (!isSuperAdmin && !isUniversityAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to delete this club' },
        { status: 403 }
      )
    }

    // Additionally, if not super admin, ensure the club belongs to the user's university
    if (!isSuperAdmin && profileData.university_id !== clubData.university_id) {
      return NextResponse.json(
        { error: 'Forbidden: Club belongs to a different university' },
        { status: 403 }
      )
    }

    // Soft delete: set a flag or actually delete? We'll do a soft delete by setting a deleted_at column?
    // The schema doesn't have a deleted_at column. We could delete the club, but that would also delete related data via cascades.
    // For simplicity, we'll actually delete the club (relying on CASCADE). In a real app, you might want to keep historical data.
    // We'll proceed with delete.
    const { error: deleteError } = await supabase
      .from('clubs')
      .delete()
      .eq('id', clubId)

    if (deleteError) {
      console.error('Error deleting club:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete club' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Club deleted successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/clubs/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}