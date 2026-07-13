// src/app/api/announcements/[id]/reject/route.ts
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-helpers'
import { adminClient } from '@/lib/supabase/admin'
import { approvalSchema } from '@/lib/validations/announcements'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { supabase } = auth
    const userId = auth.session.user.id
    const body = await request.json()
    const parsed = approvalSchema.parse(body)

    // Fetch announcement
    const { data: announcement, error: fetchError } = await supabase
      .from('announcements')
      .select('id, status, club_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    if (announcement.status !== 'pending_approval') {
      return NextResponse.json({ error: 'Only pending announcements can be rejected' }, { status: 400 })
    }

    // Check permission
    const { data: membership } = await supabase
      .from('club_memberships')
      .select('role')
      .eq('club_id', announcement.club_id)
      .eq('user_id', userId)
      .single()

    const { data: roleData } = await supabase
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

    const { data, error } = await supabase
      .from('announcements')
      .update({
        status: 'rejected',
        rejection_reason: parsed.rejection_reason || null,
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to reject' }, { status: 500 })
    }

    await adminClient.from('announcement_audit_log').insert({
      announcement_id: params.id,
      actor_id: userId,
      action: 'rejected',
      metadata: { reason: parsed.rejection_reason },
    })

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('Error in POST /api/announcements/[id]/reject:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
