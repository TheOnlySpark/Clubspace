// src/app/api/admin/members/[uid]/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-helpers'
import { createClient } from '@/lib/supabase/server'

const roleUpdateSchema = z.object({
  role: z.enum(['member', 'officer', 'club_admin', 'university_admin', 'super_admin']),
})

export async function PATCH(
  request: Request,
  { params }: { params: { uid: string } }
) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) {
      return auth.error
    }

    const { supabase } = auth
    const { uid } = params

    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = roleUpdateSchema.parse(body)

    // Get the target user's profile to get their university_id
    const { data: targetProfile, error: targetProfileError } = await supabase
      .from('profiles')
      .select('university_id, id')
      .eq('id', uid)
      .single()

    if (targetProfileError || !targetProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get the requester's profile to get their university_id and role
    const { data: requesterProfile, error: requesterProfileError } = await supabase
      .from('profiles')
      .select('university_id, id')
      .eq('id', auth.session.user.id)
      .single()

    if (requesterProfileError || !requesterProfile) {
      return NextResponse.json(
        { error: 'Requester profile not found' },
        { status: 400 }
      )
    }

    const requesterUniversityId = requesterProfile.university_id
    const targetUniversityId = targetProfile.university_id

    // Determine requester's role in the target university (or their own university)
    // We need to know what role the requester has in the target university's context.
    // If requester is super admin, they can manage any university.
    // If requester is university admin, they can only manage their own university.
    // For other roles, they cannot manage members.

    let isSuperAdmin = false
    let isUniversityAdmin = false

    // Check if requester is super admin (global)
    const { data: superAdminData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', auth.session.user.id)
      .eq('role', 'super_admin')
      .single()

    isSuperAdmin = superAdminData?.role === 'super_admin'

    // Check if requester is university admin in the target university
    if (!isSuperAdmin) {
      const { data: uniAdminData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', auth.session.user.id)
        .eq('university_id', targetUniversityId)
        .single()

      isUniversityAdmin = uniAdminData?.role === 'university_admin'
    }

    // Permission check: only super admin or university admin of the target university can manage members
    if (!(isSuperAdmin || isUniversityAdmin)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to modify user roles' },
        { status: 403 }
      )
    }

    // Additional restrictions based on requester's role
    if (!isSuperAdmin && isUniversityAdmin) {
      // University admin can only assign roles below university_admin: officer, club_admin, member
      if (parsed.role === 'university_admin' || parsed.role === 'super_admin') {
        return NextResponse.json(
          { error: 'Forbidden: University admin cannot assign university_admin or super_admin roles' },
          { status: 403 }
        )
      }
    }

    // If not super admin, ensure the target user belongs to the same university as the requester's university
    // (unless the requester is super admin)
    if (!isSuperAdmin && requesterUniversityId !== targetUniversityId) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot modify users from a different university' },
        { status: 403 }
      )
    }

    // Update the user's role in the user_roles table
    // We need to upsert: insert if not exists, update if exists
    const { data, error } = await supabase
      .from('user_roles')
      .upsert(
        {
          user_id: uid,
          university_id: targetUniversityId,
          role: parsed.role,
        },
        { onConflict: ['user_id', 'university_id'] }
      )
      .select()
      .single()

    if (error) {
      console.error('Error updating user role:', error)
      return NextResponse.json(
        { error: 'Failed to update user role' },
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
    console.error('Error in PATCH /api/admin/members/[uid]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}