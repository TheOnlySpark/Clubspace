// src/app/api/events/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-helpers'
import { createClient } from '@/lib/supabase/server'
import { eventSchema } from '@/lib/validations/events'

export async function GET(request: Request) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) {
      return auth.error
    }

    const { supabase } = auth
    const { searchParams } = new URL(request.url)

    // Get query parameters for filtering
    const clubId = searchParams.get('clubId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Start building the query
    let query = supabase.from('events').select(`
      *,
      clubs!inner(name, slug),
      club_memberships!inner(user_id, role)
    `, { count: 'exact' })

    // Apply filters
    if (clubId) {
      query = query.eq('club_id', clubId)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    // Order by start date
    query = query.order('starts_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching events:', error)
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { events: data, count },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in GET /api/events:', error)
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
    const body = await request.json()

    // Validate the event data
    const parsed = eventSchema.parse(body)

    // Get the user's profile to get their university_id and verify they can create events in the club
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

    // Verify the club exists and belongs to the user's university
    const { data: clubData, error: clubError } = await supabase
      .from('clubs')
      .select('university_id')
      .eq('id', parsed.club_id)
      .single()

    if (clubError || !clubData) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      )
    }

    // Check if the user is a member of the club (or has appropriate role)
    // For simplicity, we'll allow any member of the club to create events.
    // In a more restrictive setup, we might require admin/officer role.
    const { data: membershipData, error: membershipError } = await supabase
      .from('club_memberships')
      .select('role')
      .eq('club_id', parsed.club_id)
      .eq('user_id', userId)
      .single()

    if (membershipError) {
      // If no membership found, the user is not a member of the club
      return NextResponse.json(
        { error: 'You are not a member of this club' },
        { status: 403 }
      )
    }

    // Insert the event
    const { data, error } = await supabase
      .from('events')
      .insert({
        ...parsed,
        created_by: userId,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating event:', error)
      return NextResponse.json(
        { error: 'Failed to create event' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Validation error' },
        { status: 400 }
      )
    }
    console.error('Error in POST /api/events:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}