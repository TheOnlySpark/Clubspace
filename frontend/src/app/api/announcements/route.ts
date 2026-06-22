// src/app/api/announcements/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-helpers'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { announcementSchema } from '@/lib/validations/announcements'

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
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Start building the query
    let query = supabase.from('announcements').select(`
      *,
      clubs!inner(name),
      profiles!inner(first_name, last_name)
    `, { count: 'exact' })

    // Apply filters
    if (clubId) {
      query = query.eq('club_id', clubId)
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    // Order by creation date
    query = query.order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching announcements:', error)
      return NextResponse.json(
        { error: 'Failed to fetch announcements' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { announcements: data, count },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in GET /api/announcements:', error)
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

    // Validate the announcement data
    const parsed = announcementSchema.parse(body)

    // Get the user's profile to get university_id and id (for validation)
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
    // For announcement creation, we'll allow club admins, officers, university admins, and super admins.
    // We'll check the user's role in the club and their global role.
    const { data: membershipData, error: membershipError } = await supabase
      .from('club_memberships')
      .select('role')
      .eq('club_id', parsed.club_id)
      .eq('user_id', userId)
      .single()

    const isClubAdminOrOfficer = membershipData?.role === 'admin' || membershipData?.role === 'officer'

    // Check if the user is a university admin or super admin for the club's university
    const { data: userRoleData, error: userRoleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('university_id', clubData.university_id)
      .single()

    const isUniversityAdmin = userRoleData?.role === 'university_admin'
    const isSuperAdmin = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'super_admin')
      .then(({ data }) => (data?.length ?? 0) > 0)

    if (!(isClubAdminOrOfficer || isUniversityAdmin || isSuperAdmin)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to create announcement' },
        { status: 403 }
      )
    }

    // Insert the announcement
    const { data: newAnnouncement, error: insertError } = await supabase
      .from('announcements')
      .insert({
        ...parsed,
        sent_by: userId,
      })
      .select()
      .single()

    if (insertError || !newAnnouncement) {
      console.error('Error inserting announcement:', insertError)
      return NextResponse.json(
        { error: 'Failed to create announcement' },
        { status: 500 }
      )
    }

    // After creating the announcement, create notifications for all club members
    // We'll get all members of the club (profiles with user_roles in the club) and create a notification for each.
    // We'll use the admin client to bypass RLS for reading profiles and inserting notifications.

    // Get the club members via club_memberships
    const { data: clubMemberships, error: membershipsError } = await adminClient
      .from('club_memberships')
      .select('user_id')
      .eq('club_id', parsed.club_id);

    if (membershipsError) {
      console.error('Error fetching club members:', membershipsError);
      // We'll still return success for the announcement creation, but log the error.
    } else {
      // Create notifications for each member
      const notificationsToInsert = clubMemberships.map((membership: any) => ({
        announcement_id: newAnnouncement.id,
        user_id: membership.user_id,
      }));

      if (notificationsToInsert.length > 0) {
        try {
          const { error: notificationsError } = await adminClient
            .from('notifications')
            .insert(notificationsToInsert);

          if (notificationsError) {
            console.error('Error creating notifications:', notificationsError);
            // We'll still return success for the announcement creation.
          }
        } catch (err) {
          console.error('Error creating notifications for announcement:', err);
        }
      }
    }

    return NextResponse.json(newAnnouncement, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message },
        { status: 400 }
      )
    }
    console.error('Error in POST /api/announcements:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}