export const dynamic = 'force-dynamic'
// src/app/api/announcements/[id]/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-helpers'
import { adminClient } from '@/lib/supabase/admin'
import { announcementUpdateSchema } from '@/lib/validations/announcements'

async function getAnnouncementAndPermissions(announcementId: string, userId: string) {
  // Use adminClient to bypass RLS for permission checks — RLS SELECT policies
  // block higher-privilege admins (university_admin, super_admin) from seeing
  // club-scoped announcements when they aren't club members.
  const { data: announcement, error } = await adminClient
    .from('announcements')
    .select('*, clubs(name, university_id), profiles!announcements_author_id_fkey(first_name, last_name)')
    .eq('id', announcementId)
    .single()

  if (error || !announcement) return { announcement: null }

  const isAuthor = announcement.author_id === userId

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

  return {
    announcement,
    isAuthor,
    isClubAdmin,
    userRole,
    canEdit: isAuthor || isClubAdmin || ['university_admin', 'super_admin'].includes(userRole),
    canDelete: isClubAdmin || ['university_admin', 'super_admin'].includes(userRole),
    canApprove: isClubAdmin || ['university_admin', 'super_admin'].includes(userRole),
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { supabase } = auth
    const announcementId = params.id

    if (!announcementId) {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('announcements')
      .select(`
        *,
        clubs(name),
        profiles!announcements_author_id_fkey(first_name, last_name)
      `)
      .eq('id', announcementId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch announcement' }, { status: 500 })
    }

    const enriched = {
      ...data,
      club_name: data.clubs?.name ?? null,
      author_name: `${data.profiles?.first_name ?? ''} ${data.profiles?.last_name ?? ''}`.trim() || 'Unknown',
    }

    // Check if the current user has read this announcement
    const { data: readData } = await supabase
      .from('announcement_reads')
      .select('read_at')
      .eq('announcement_id', announcementId)
      .eq('user_id', auth.session.user.id)
      .single()

    return NextResponse.json({ ...enriched, is_read: !!readData }, { status: 200 })
  } catch (error: any) {
    console.error('Error in GET /api/announcements/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const announcementId = params.id
    const body = await request.json()
    const parsed = announcementUpdateSchema.parse(body)

    const { announcement, canEdit } = await getAnnouncementAndPermissions(
      announcementId, auth.session.user.id
    )

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only allow editing drafts or rejected announcements (not published ones)
    if (!['draft', 'rejected'].includes(announcement.status) && !parsed.pinned) {
      return NextResponse.json({ error: 'Can only edit draft or rejected announcements' }, { status: 400 })
    }

    // Use adminClient to bypass RLS — permissions already verified above
    const { data, error } = await adminClient
      .from('announcements')
      .update(parsed)
      .eq('id', announcementId)
      .select()
      .single()

    if (error) {
      console.error('Error updating announcement:', error)
      return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 })
    }

    // Audit log
    await adminClient.from('announcement_audit_log').insert({
      announcement_id: announcementId,
      actor_id: auth.session.user.id,
      action: 'edited',
      metadata: { fields_updated: Object.keys(parsed) },
    })

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 })
    }
    console.error('Error in PATCH /api/announcements/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const announcementId = params.id

    const { announcement, canDelete } = await getAnnouncementAndPermissions(
      announcementId, auth.session.user.id
    )

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // For published announcements, archive instead of hard-delete (audit trail preservation)
    if (announcement.status === 'published') {
      const { error: archiveError, count } = await adminClient
        .from('announcements')
        .update({ status: 'archived' })
        .eq('id', announcementId)

      if (archiveError) {
        console.error('Error archiving announcement:', archiveError)
        return NextResponse.json({ error: 'Failed to archive announcement' }, { status: 500 })
      }

      await adminClient.from('announcement_audit_log').insert({
        announcement_id: announcementId,
        actor_id: auth.session.user.id,
        action: 'archived',
      })

      return NextResponse.json({ message: 'Announcement archived' }, { status: 200 })
    }

    // Hard-delete drafts/rejected — use adminClient since RLS SELECT
    // policies may prevent the user-scoped client from seeing non-published items
    const { error } = await adminClient
      .from('announcements')
      .delete()
      .eq('id', announcementId)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 })
    }

    await adminClient.from('announcement_audit_log').insert({
      announcement_id: announcementId,
      actor_id: auth.session.user.id,
      action: 'deleted',
    })

    return NextResponse.json({ message: 'Announcement deleted' }, { status: 200 })
  } catch (error: any) {
    console.error('Error in DELETE /api/announcements/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}