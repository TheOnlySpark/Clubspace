import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-helpers'
import { adminClient } from '@/lib/supabase/admin'

const slugUpdateSchema = z.object({
  slug: z.string().min(2).max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens')
})

export async function PATCH(
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

    const body = await request.json()
    const parsed = slugUpdateSchema.parse(body)

    // Check if the user is a university admin or super admin
    const { data: userRoleData } = await adminClient
      .from('user_roles')
      .select('role, university_id')
      .eq('user_id', auth.session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const role = userRoleData?.role
    if (role !== 'university_admin' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Only University Admins or Super Admins can update slugs' }, { status: 403 })
    }

    // Get the club's university_id to ensure uniqueness scope
    const { data: clubData } = await adminClient
      .from('clubs')
      .select('university_id')
      .eq('id', clubId)
      .single()

    if (!clubData) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 })
    }

    if (role === 'university_admin' && clubData.university_id !== userRoleData?.university_id) {
      return NextResponse.json({ error: 'Forbidden: Cannot update slugs for clubs outside your university' }, { status: 403 })
    }

    // Check if new slug is already taken
    const { data: existingClub } = await adminClient
      .from('clubs')
      .select('id')
      .eq('university_id', clubData.university_id)
      .eq('slug', parsed.slug)
      .neq('id', clubId)
      .single()

    if (existingClub) {
      return NextResponse.json({ error: 'This slug is already in use by another club in this university' }, { status: 400 })
    }

    // Update slug using adminClient
    const { data, error } = await adminClient
      .from('clubs')
      .update({ slug: parsed.slug })
      .eq('id', clubId)
      .select()
      .single()

    if (error) {
      console.error('Error updating club slug:', error)
      return NextResponse.json({ error: 'Failed to update club slug' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Validation failed' }, { status: 400 })
    }
    console.error('Error in PATCH /api/clubs/[id]/slug:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
