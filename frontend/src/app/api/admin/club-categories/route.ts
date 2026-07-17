import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-helpers'
import { createClient } from '@/lib/supabase/server'
import { clubCategorySchema } from '@/lib/validations/clubs'

export async function GET(request: Request) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { supabase } = auth
    const { data, error } = await supabase
      .from('club_categories')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching club categories:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('Error in GET /api/admin/club-categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { supabase } = auth
    
    // Check if user is university admin or super admin
    const { data: userRoleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', auth.session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!['university_admin', 'super_admin'].includes(userRoleData?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('university_id')
      .eq('id', auth.session.user.id)
      .single()

    if (!profile?.university_id) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 400 })
    }

    const body = await request.json()
    const parsed = clubCategorySchema.parse(body)

    const { data, error } = await supabase
      .from('club_categories')
      .insert({
        university_id: profile.university_id,
        name: parsed.name
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A category with this name already exists' }, { status: 400 })
      }
      console.error('Error creating club category:', error)
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Validation failed' }, { status: 400 })
    }
    console.error('Error in POST /api/admin/club-categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
