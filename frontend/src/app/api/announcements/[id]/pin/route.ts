// src/app/api/announcements/[id]/pin/route.ts
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-helpers'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const userId = auth.session.user.id

    // Use adminClient to bypass RLS — we do our own permission checks below
    const { data: announcement, error: fetchError } = await adminClient
      .from('announcements')
      .select('id, club_id, pinned, university_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    // Check permission
    const { data: membership } = await adminClient
      .from('club_memberships')
      .select('role')
      .eq('club_id', announcement.club_id)
      .eq('user_id', userId)
      .single()

    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const userRole = roleData?.role ?? 'member'
    const isClubAdmin = membership?.role === 'admin'

    if (!isClubAdmin && !['university_admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const newPinned = !announcement.pinned

    // If pinning, check max_pinned_per_club
    if (newPinned && announcement.club_id) {
      const { data: settings } = await adminClient
        .from('announcement_settings')
        .select('max_pinned_per_club')
        .eq('university_id', announcement.university_id)
        .single()

      const maxPinned = settings?.max_pinned_per_club ?? 1

      const { count } = await adminClient
        .from('announcements')
        .select('id', { count: 'exact', head: true })
        .eq('club_id', announcement.club_id)
        .eq('pinned', true)

      if ((count ?? 0) >= maxPinned) {
        return NextResponse.json(
          { error: `Maximum ${maxPinned} pinned announcement(s) per club` },
          { status: 400 }
        )
      }
    }

    const { data, error } = await adminClient
      .from('announcements')
      .update({ pinned: newPinned })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to toggle pin' }, { status: 500 })
    }

    await adminClient.from('announcement_audit_log').insert({
      announcement_id: params.id,
      actor_id: userId,
      action: newPinned ? 'pinned' : 'unpinned',
    })

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('Error in POST /api/announcements/[id]/pin:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
