// src/app/api/announcements/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-helpers'
import { adminClient } from '@/lib/supabase/admin'
import { announcementCreateSchema } from '@/lib/validations/announcements'

export async function GET(request: Request) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { supabase } = auth
    const { searchParams } = new URL(request.url)

    const clubId = searchParams.get('clubId')
    const status = searchParams.get('status')
    const visibility = searchParams.get('visibility')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const pinnedOnly = searchParams.get('pinned') === 'true'

    let query = supabase.from('announcements').select(`
      *,
      clubs(name),
      profiles!announcements_author_id_fkey(first_name, last_name)
    `, { count: 'exact' })

    if (clubId) query = query.eq('club_id', clubId)
    if (status) query = query.eq('status', status)
    if (visibility) query = query.eq('visibility', visibility)
    if (pinnedOnly) query = query.eq('pinned', true)
    if (search) query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`)

    // App-layer scheduled publish: auto-publish announcements whose publish_at has passed
    // We do this check on read so we don't need pg_cron
    const now = new Date().toISOString()
    const { data: scheduledToPublish } = await adminClient
      .from('announcements')
      .select('id')
      .eq('status', 'draft')
      .not('publish_at', 'is', null)
      .lte('publish_at', now)

    if (scheduledToPublish && scheduledToPublish.length > 0) {
      const ids = scheduledToPublish.map(a => a.id)
      await adminClient
        .from('announcements')
        .update({ status: 'published' })
        .in('id', ids)

      // Audit log for each
      const auditEntries = ids.map(id => ({
        announcement_id: id,
        actor_id: auth.session.user.id,
        action: 'published',
        metadata: { trigger: 'scheduled_publish' },
      }))
      await adminClient.from('announcement_audit_log').insert(auditEntries)
    }

    // App-layer auto-archive: archive expired announcements
    const { data: expiredAnnouncements } = await adminClient
      .from('announcements')
      .select('id')
      .eq('status', 'published')
      .not('expires_at', 'is', null)
      .lte('expires_at', now)

    if (expiredAnnouncements && expiredAnnouncements.length > 0) {
      const ids = expiredAnnouncements.map(a => a.id)
      await adminClient
        .from('announcements')
        .update({ status: 'archived' })
        .in('id', ids)
    }

    // Pinned first, then by created_at desc
    query = query
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching announcements:', error)
      return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
    }

    // Enrich with joined names
    const enriched = (data || []).map((ann: any) => ({
      ...ann,
      club_name: ann.clubs?.name ?? null,
      author_name: `${ann.profiles?.first_name ?? ''} ${ann.profiles?.last_name ?? ''}`.trim() || 'Unknown',
    }))

    return NextResponse.json({ announcements: enriched, count }, { status: 200 })
  } catch (error: any) {
    console.error('Error in GET /api/announcements:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { supabase } = auth
    const body = await request.json()
    const parsed = announcementCreateSchema.parse(body)

    const userId = auth.session.user.id

    // Get user profile for university_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('university_id')
      .eq('id', userId)
      .single()

    if (!profile?.university_id) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 400 })
    }

    // Get user's role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const userRole = roleData?.role ?? 'member'

    // Members cannot create announcements
    if (userRole === 'member') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Enforce visibility rules
    if (['officer', 'club_admin'].includes(userRole) && parsed.visibility !== 'club') {
      return NextResponse.json({ error: 'You can only create club-scoped announcements' }, { status: 403 })
    }

    // Enforce status rules: officers cannot publish directly
    let finalStatus = parsed.status || 'draft'
    if (userRole === 'officer' && finalStatus === 'published') {
      finalStatus = 'pending_approval'
    }

    // If club_id provided, verify membership
    if (parsed.club_id) {
      const { data: membership } = await supabase
        .from('club_memberships')
        .select('role')
        .eq('club_id', parsed.club_id)
        .eq('user_id', userId)
        .single()

      if (!membership && !['university_admin', 'super_admin'].includes(userRole)) {
        return NextResponse.json({ error: 'You are not a member of this club' }, { status: 403 })
      }
    }

    // Insert
    const { data: newAnnouncement, error: insertError } = await supabase
      .from('announcements')
      .insert({
        university_id: profile.university_id,
        club_id: parsed.club_id,
        author_id: userId,
        title: parsed.title,
        body: parsed.body,
        status: finalStatus,
        visibility: parsed.visibility,
        pinned: parsed.pinned ?? false,
        publish_at: parsed.publish_at ?? null,
        expires_at: parsed.expires_at ?? null,
      })
      .select()
      .single()

    if (insertError || !newAnnouncement) {
      console.error('Error inserting announcement:', insertError)
      return NextResponse.json({ error: 'Failed to create announcement', details: insertError }, { status: 500 })
    }

    // Audit log
    await adminClient.from('announcement_audit_log').insert({
      announcement_id: newAnnouncement.id,
      actor_id: userId,
      action: 'created',
      metadata: { status: finalStatus, visibility: parsed.visibility },
    })

    return NextResponse.json(newAnnouncement, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 })
    }
    console.error('Error in POST /api/announcements:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}