// src/app/api/university/[id]/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-helpers'
import { createClient } from '@/lib/supabase/server'

const universityUpdateSchema = z.object({
  name: z.string().min(1, 'University name is required').max(100),
  slug: z.string().min(1, 'Slug is required').max(50).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  domain_allowlist: z.array(z.string()).optional(),
})

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
    const { id: universityId } = params

    if (!universityId) {
      return NextResponse.json(
        { error: 'University ID is required' },
        { status: 400 }
      )
    }

    // Get the university
    const { data: university, error: universityError } = await supabase
      .from('universities')
      .select('*')
      .eq('id', universityId)
      .single()

    if (universityError) {
      if (universityError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'University not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to fetch university' },
        { status: 500 }
      )
    }

    // Check if the user belongs to this university (or is super admin)
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

    if (!isSuperAdmin && profileData.university_id !== universityId) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to view this university' },
        { status: 403 }
      )
    }

    return NextResponse.json(university, { status: 200 })
  } catch (error: any) {
    console.error('Error in GET /api/university/[id]:', error)
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
    const { id: universityId } = params

    if (!universityId) {
      return NextResponse.json(
        { error: 'University ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = universityUpdateSchema.parse(body)

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

    // Only allow updating own university unless super admin
    if (!isSuperAdmin && profileData.university_id !== universityId) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to update this university' },
        { status: 403 }
      )
    }

    // Optionally, check if slug is unique (excluding current university)
    if (parsed.slug) {
      const { data: existingUniversity, error: slugError } = await supabase
        .from('universities')
        .select('id')
        .eq('slug', parsed.slug)
        .neq('id', universityId)
        .single()

      if (slugError && slugError.code !== 'PGRST116') {
        throw slugError
      }

      if (existingUniversity) {
        return NextResponse.json(
          { error: 'Slug already in use' },
          { status: 400 }
        )
      }
    }

    // Update the university
    const { data, error } = await supabase
      .from('universities')
      .update(parsed)
      .eq('id', universityId)
      .select()
      .single()

    if (error) {
      console.error('Error updating university:', error)
      return NextResponse.json(
        { error: 'Failed to update university' },
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
    console.error('Error in PATCH /api/university/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}