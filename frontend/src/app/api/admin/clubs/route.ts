// src/app/api/admin/clubs/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-helpers'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { clubSchema } from '@/lib/validations/clubs'

export async function GET(
  request: Request,
) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) {
      return auth.error
    }

    const { supabase } = auth
    const { session } = auth

    // Get user's profile to get university_id
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('university_id, id')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profileData) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 400 }
      )
    }

    const universityId = profileData.university_id

    // Check if user is university admin or super admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('university_id', universityId)
      .single()

    const isUniversityAdmin = roleData?.role === 'university_admin'
    const { data: superAdminData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'super_admin')
      .single()

    const isSuperAdmin = superAdminData?.role === 'super_admin'

    if (!(isUniversityAdmin || isSuperAdmin)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to manage clubs' },
        { status: 403 }
      )
    }

    // Fetch clubs for the university (or all if super admin)
    let query = supabase.from('clubs').select('*')

    if (!isSuperAdmin) {
      query = query.eq('university_id', universityId)
    }

    const { data: clubs, error: clubsError } = await query.order('created_at', { ascending: false })

    if (clubsError) {
      throw clubsError
    }

    return NextResponse.json(clubs, { status: 200 })
  } catch (error: any) {
    console.error('Error in GET /api/admin/clubs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) {
      return auth.error
    }

    const { supabase } = auth
    const { session } = auth

    // Get user's profile to get university_id
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('university_id, id')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profileData) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 400 }
      )
    }

    const universityId = profileData.university_id

    // Check if user is university admin or super admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('university_id', universityId)
      .single()

    const isUniversityAdmin = roleData?.role === 'university_admin'
    const { data: superAdminData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'super_admin')
      .single()

    const isSuperAdmin = superAdminData?.role === 'super_admin'

    if (!(isUniversityAdmin || isSuperAdmin)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to create clubs' },
        { status: 403 }
      )
    }

    const body = await request.json()
    // For club creation, we need to set university_id to the user's university (unless super admin?)
    // According to build prompt, super admin can create clubs in any university? We'll allow super admin to specify university_id?
    // For simplicity, we'll restrict club creation to the user's university unless super admin provides a university_id.
    // We'll add university_id to the schema for super admin.

    // We'll parse with clubSchema partial and then add university_id
    const parsed = clubSchema.parse(body)

    // Determine university_id for the club
    let clubUniversityId = universityId
    if (isSuperAdmin && body.university_id) {
      // Super admin can specify a different university
      clubUniversityId = body.university_id
      // Verify that the university exists
      const { data: uniData, error: uniError } = await supabase
        .from('universities')
        .select('id')
        .eq('id', clubUniversityId)
        .single()
      if (uniError || !uniData) {
        return NextResponse.json(
          { error: 'Invalid university ID' },
          { status: 400 }
        )
      }
    }

    // Generate slug
    const baseSlug = parsed.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
    const slug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`

    const { name, description, privacy, join_policy, banner_url } = parsed

    // Insert the club
    const { data, error } = await supabase
      .from('clubs')
      .insert({
        name,
        description,
        privacy,
        join_policy,
        banner_url,
        slug,
        university_id: clubUniversityId,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating club:', error)
      return NextResponse.json(
        { error: `Failed to create club: ${error.message || JSON.stringify(error)}` },
        { status: 500 }
      )
    }

    // Automatically make the creator a club admin (use adminClient to bypass RLS)
    const { error: membershipError } = await adminClient.from('club_memberships').insert({
      club_id: data.id,
      user_id: session.user.id,
      role: 'admin'
    })
    
    if (membershipError) {
      console.error('Error adding initial club admin:', membershipError)
      // We don't fail the club creation, but we should log this.
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Validation failed' },
        { status: 400 }
      )
    }
    console.error('Error in POST /api/admin/clubs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}