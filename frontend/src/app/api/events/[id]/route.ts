// src/app/api/events/[id]/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-helpers'
import { createClient } from '@/lib/supabase/server'
import { eventSchema } from '@/lib/validations/events'

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
    const { id: eventId } = params

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        clubs!inner(name, slug),
        profiles!inner(first_name, last_name)
      `)
      .eq('id', eventId)
      .single()

    if (error) {
      console.error('Error fetching event:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to fetch event' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('Error in GET /api/events/[id]:', error)
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
    const { id: eventId } = params

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    // Partial update - we'll allow updating any field except id and created_by
    const parsed = eventSchema.partial().parse(body)

    // Verify the user has permission to edit this event
    // They must be the creator or have appropriate role in the club
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('created_by, club_id')
      .eq('id', eventId)
      .single()

    if (eventError || !eventData) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const isCreator = eventData.created_by === auth.session.user.id

    // Get the user's role in the club
    const { data: membershipData, error: membershipError } = await supabase
      .from('club_memberships')
      .select('role')
      .eq('club_id', eventData.club_id)
      .eq('user_id', auth.session.user.id)
      .single()

    const isClubAdminOrOfficer = membershipData?.role === 'admin' || membershipData?.role === 'officer'

    // Also check if the user is a university admin or super admin for the club's university
    const { data: clubData, error: clubError } = await supabase
      .from('clubs')
      .select('university_id')
      .eq('id', eventData.club_id)
      .single()

    if (clubError || !clubData) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      )
    }

    const { data: userRoleData, error: userRoleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', auth.session.user.id)
      .eq('university_id', clubData.university_id)
      .single()

    const isUniversityAdmin = userRoleData?.role === 'university_admin'
    const isSuperAdmin = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', auth.session.user.id)
      .eq('role', 'super_admin')
      .then(({ data }) => (data?.length ?? 0) > 0)

    if (!(isCreator || isClubAdminOrOfficer || isUniversityAdmin || isSuperAdmin)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to edit this event' },
        { status: 403 }
      )
    }

    // Update the event
    const { data, error } = await supabase
      .from('events')
      .update(parsed)
      .eq('id', eventId)
      .select()
      .single()

    if (error) {
      console.error('Error updating event:', error)
      return NextResponse.json(
        { error: 'Failed to update event' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Validation error' },
        { status: 400 }
      )
    }
    console.error('Error in PATCH /api/events/[id]:', error)
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
    const { id: eventId } = params

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    // Verify the user has permission to delete this event
    // Similar to PATCH, but we might be more restrictive (only creator or admins)
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('created_by, club_id')
      .eq('id', eventId)
      .single()

    if (eventError || !eventData) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const isCreator = eventData.created_by === auth.session.user.id

    // Get the user's role in the club
    const { data: membershipData, error: membershipError } = await supabase
      .from('club_memberships')
      .select('role')
      .eq('club_id', eventData.club_id)
      .eq('user_id', auth.session.user.id)
      .single()

    const isClubAdminOrOfficer = membershipData?.role === 'admin' || membershipData?.role === 'officer'

    // Also check if the user is a university admin or super admin for the club's university
    const { data: clubData, error: clubError } = await supabase
      .from('clubs')
      .select('university_id')
      .eq('id', eventData.club_id)
      .single()

    if (clubError || !clubData) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      )
    }

    const { data: userRoleData, error: userRoleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', auth.session.user.id)
      .eq('university_id', clubData.university_id)
      .single()

    const isUniversityAdmin = userRoleData?.role === 'university_admin'
    const isSuperAdmin = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', auth.session.user.id)
      .eq('role', 'super_admin')
      .then(({ data }) => (data?.length ?? 0) > 0)

    if (!(isCreator || isClubAdminOrOfficer || isUniversityAdmin || isSuperAdmin)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to delete this event' },
        { status: 403 }
      )
    }

    // Delete the event
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)

    if (error) {
      console.error('Error deleting event:', error)
      return NextResponse.json(
        { error: 'Failed to delete event' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Event deleted successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in DELETE /api/events/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}