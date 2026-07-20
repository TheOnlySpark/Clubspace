export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-helpers'
import { adminClient } from '@/lib/supabase/admin'
import { clubCreateSchema } from '@/lib/validations/clubs'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function GET(request: Request) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { supabase } = auth
    const { searchParams } = new URL(request.url)
    
    const categoryId = searchParams.get('category_id')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // RLS will automatically filter by university_id for the user
    let query = supabase
      .from('clubs')
      .select(`
        *,
        club_categories(name)
      `, { count: 'exact' })
      .eq('status', 'active')

    if (categoryId) query = query.eq('category_id', categoryId)
    if (search) query = query.ilike('name', `%${search}%`)

    query = query
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching clubs:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ clubs: data, count }, { status: 200 })
  } catch (error: any) {
    console.error('Error in GET /api/clubs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { supabase } = auth
    const userId = auth.session.user.id

    // Only University Admin or Super Admin can create clubs
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const userRole = roleData?.role ?? 'member'
    if (!['university_admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get the user's university_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('university_id')
      .eq('id', userId)
      .single()

    if (!profile?.university_id) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 400 })
    }

    const body = await request.json()
    const parsed = clubCreateSchema.parse(body)
    
    const slug = generateSlug(parsed.name)

    // Ensure slug uniqueness (adminClient to check all)
    const { data: existingClub } = await adminClient
      .from('clubs')
      .select('id')
      .eq('university_id', profile.university_id)
      .eq('slug', slug)
      .single()

    if (existingClub) {
      return NextResponse.json({ error: 'A club with this name/slug already exists in your university' }, { status: 400 })
    }

    // Create the club using adminClient to safely perform the transaction or insert
    const { data: newClub, error: insertError } = await adminClient
      .from('clubs')
      .insert({
        university_id: profile.university_id,
        name: parsed.name,
        slug,
        description: parsed.description,
        category_id: parsed.category_id,
        status: parsed.status,
        logo_url: parsed.logo_url,
        banner_url: parsed.banner_url,
        contact_email: parsed.contact_email,
        social_links: parsed.social_links,
        privacy: parsed.privacy,
        join_policy: parsed.join_policy,
        created_by: userId
      })
      .select()
      .single()

    if (insertError || !newClub) {
      console.error('Error inserting club:', insertError)
      return NextResponse.json({ error: 'Failed to create club' }, { status: 500 })
    }

    // Assign initial Club Admin
    const { error: membershipError } = await adminClient
      .from('club_memberships')
      .insert({
        club_id: newClub.id,
        user_id: parsed.initial_admin_id,
        role: 'admin'
      })

    if (membershipError) {
      console.error('Error assigning initial admin:', membershipError)
      // We don't rollback the club creation, but we note the failure
      // (a real robust implementation might use a postgres function for a transaction)
    }

    return NextResponse.json(newClub, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 })
    }
    console.error('Error in POST /api/clubs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
