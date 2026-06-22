// src/app/api/announcements/[id]/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-helpers'
import { createClient } from '@/lib/supabase/server'
import { announcementSchema } from '@/lib/validations/announcements'

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
    const { id: announcementId } = params

    if (!announcementId) {
      return NextResponse.json(
        { error: 'Announcement ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        clubs!inner(name),
        profiles!inner(first_name, last_name)
      `)
      .eq('id', announcementId)
      .single()

    if (error) {
      console.error('Error fetching announcement:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Announcement not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to fetch announcement' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('Error in GET /api/announcements/[id]:', error)
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
    const { id: announcementId } = params

    if (!announcementId) {
      return NextResponse.json(
        { error: 'Announcement ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    // Partial update - we'll allow updating any field except id and sent_by
    const parsed = announcementSchema.partial().parse(body)

    // Verify the user has permission to edit this announcement
    // They must be the creator or have appropriate role in the club
    const { data: announcementData, error: announcementError } = await supabase
      .from('announcements')
      .select('sent_by, club_id')
      .eq('id', announcementId)
      .single()

    if (announcementError || !announcementData) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    const isCreator = announcementData.sent_by === auth.session.user.id

    // Get the user's role in the club
    const { data: membershipData, error: membershipError } = await supabase
      .from('club_memberships')
      .select('role')
      .eq('club_id', announcementData.club_id)
      .eq('user_id', auth.session.user.id)
      .single()

    const isClubAdminOrOfficer = membershipData?.role === 'admin' || membershipData?.role === 'officer'

    // Also check if the user is a university admin or super admin for the club's university
    const { data: clubData, error: clubError } = await supabase
      .from('clubs')
      .select('university_id')
      .eq('id', announcementData.club_id)
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
      .then(({ data }) => data?.length > 0)

    if (!(isCreator || isClubAdminOrOfficer || isUniversityAdmin || isSuperAdmin)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to edit this announcement' },
        { status: 403 }
      )
    }

    // Update the announcement
    const { data, error } = await supabase
      .from('announcements')
      .update(parsed)
      .eq('id', announcementId)
      .select()
      .single()

    if (error) {
      console.error('Error updating announcement:', error)
      return NextResponse.json(
        { error: 'Failed to update announcement' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Error in PATCH /api/announcements/[id]:', error)
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
    const { id: announcementId } = params

    if (!announcementId) {
      return NextResponse.json(
        { error: 'Announcement ID is required' },
        { status: 400 }
      )
    }

    // Verify the user has permission to delete this announcement
    // Similar to PATCH, but we might be more restrictive (only creator or admins)
    const { data: announcementData, error: announcementError } = await supabase
      .from('announcements')
      .select('sent_by, club_id')
      .eq('id', announcementId)
      .single()

    if (announcementError || !announcementData) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    const isCreator = announcementData.sent_by === auth.session.user.id

    // Get the user's role in the club
    const { data: membershipData, error: membershipError } = await supabase
      .from('club_memberships')
      .select('role')
      .eq('club_id', announcementData.club_id)
      .eq('user_id', auth.session.user.id)
      .single()

    const isClubAdminOrOfficer = membershipData?.role === 'admin' || membershipData?.role === 'officer'

    // Also check if the user is a university admin or super admin for the club's university
    const { data: clubData, error: clubError } = await supabase
      .from('clubs')
      .select('university_id')
      .eq('id', announcementData.club_id)
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
      .then(({ data }) => data?.length > 0)

    if (!(isCreator || isClubAdminOrOfficer || isUniversityAdmin || isSuperAdmin)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to delete this announcement' },
        { status: 403 }
      )
    }

    // Delete the announcement
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', announcementId)

    if (error) {
      console.error('Error deleting announcement:', error)
      return NextResponse.json(
        { error: 'Failed to delete announcement' },
        { status: 500 }
      )
    }

    // Also delete the notifications associated with this announcement
    // We'll do this in a separate query, but we can do it now.
    // We'll use the admin client to bypass RLS.
    try {
      await adminClient
        .from('notifications')
        .delete()
        .eq('announcement_id', announcementId)
    } catch (err) {
      console.error('Error deleting notifications for announcement:', err)
      // We'll still return success for the announcement deletion.
    }

    return NextResponse.json(
      { message: 'Announcement deleted successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in DELETE /api/announcements/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}