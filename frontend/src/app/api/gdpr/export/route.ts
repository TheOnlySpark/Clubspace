export const dynamic = 'force-dynamic'
// src/app/api/gdpr/export/route.ts
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-helpers'
import { adminClient } from '@/lib/supabase/admin'

export async function GET(
  request: Request,
) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) {
      return auth.error
    }

    const { session } = auth
    const userId = session.user.id

    // Fetch all data for the user from various tables
    // We'll use the adminClient to bypass RLS

    // Start with the profile
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError
    }

    // Fetch club memberships with club details
    const { data: memberships, error: membershipsError } = await adminClient
      .from('club_memberships')
      .select(`
        *,
        clubs!inner(id, name, description, privacy, join_policy)
      `)
      .eq('user_id', userId)

    if (membershipsError && membershipsError.code !== 'PGRST116') {
      throw membershipsError
    }

    


    // Fetch announcements created by the user
    const { data: announcements, error: announcementsError } = await adminClient
      .from('announcements')
      .select('*')
      .eq('author_id', userId)

    if (announcementsError && announcementsError.code !== 'PGRST116') {
      throw announcementsError
    }

    // Fetch announcement read receipts
    const { data: announcementReads, error: readsError } = await adminClient
      .from('announcement_reads')
      .select('*')
      .eq('user_id', userId)

    if (readsError && readsError.code !== 'PGRST116') {
      throw readsError
    }

    // Fetch invite links created by the user
    const { data: invites, error: invitesError } = await adminClient
      .from('invite_links')
      .select('*')
      .eq('created_by', userId)

    if (invitesError && invitesError.code !== 'PGRST116') {
      throw invitesError
    }

    // Fetch GDPR requests (if any)
    const { data: gdprRequests, error: gdprRequestsError } = await adminClient
      .from('gdpr_requests')
      .select('*')
      .eq('user_id', userId)

    if (gdprRequestsError && gdprRequestsError.code !== 'PGRST116') {
      throw gdprRequestsError
    }

    // Compile all data
    const userData = {
      profile: profile || null,
      memberships: memberships || [],
      
      announcements: announcements || [],
      announcement_reads: announcementReads || [],
      invite_links: invites || [],
      gdpr_requests: gdprRequests || [],
    }

    // Return as JSON download
    return new NextResponse(JSON.stringify(userData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="clubspace-data-${userId}.json"`,
      },
    })
  } catch (error: any) {
    console.error('Error in GET /api/gdpr/export:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
