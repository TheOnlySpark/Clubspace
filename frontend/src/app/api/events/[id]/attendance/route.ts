// src/app/api/events/[id]/attendance/route.ts
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-helpers'
import { createClient } from '@/lib/supabase/server'

export async function POST(
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

    const userId = auth.session.user.id

    // Check if the event exists
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('id, club_id, status')
      .eq('id', eventId)
      .single()

    if (eventError || !eventData) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Optional: Check if the event is published or if the user has permission to attend
    // For now, we'll allow attendance regardless of status (but we could restrict to published events)
    // We'll also check the user's membership in the club if needed.

    // Check if the user is already attending
    const { data: existingAttendance, error: attendanceError } = await supabase
      .from('event_attendance')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single()

    if (attendanceError && attendanceError.code !== 'PGRST116') {
      // PGRST116 means no rows returned, which is fine
      console.error('Error checking attendance:', attendanceError)
      return NextResponse.json(
        { error: 'Failed to check attendance' },
        { status: 500 }
      )
    }

    if (existingAttendance) {
      // Remove attendance
      const { error } = await supabase
        .from('event_attendance')
        .delete()
        .eq('id', existingAttendance.id)

      if (error) {
        console.error('Error removing attendance:', error)
        return NextResponse.json(
          { error: 'Failed to remove attendance' },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { message: 'Attendance removed', attending: false },
        { status: 200 }
      )
    } else {
      // Add attendance
      const { error } = await supabase
        .from('event_attendance')
        .insert({
          event_id: eventId,
          user_id: userId,
        })

      if (error) {
        console.error('Error adding attendance:', error)
        return NextResponse.json(
          { error: 'Failed to add attendance' },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { message: 'Attendance added', attending: true },
        { status: 200 }
      )
    }
  } catch (error: any) {
    console.error('Error in POST /api/events/[id]/attendance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}