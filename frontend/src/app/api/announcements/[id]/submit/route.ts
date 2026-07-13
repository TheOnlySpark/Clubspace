// src/app/api/announcements/[id]/submit/route.ts
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

    const { supabase } = auth
    const userId = auth.session.user.id

    // Verify announcement exists and user is the author
    const { data: announcement, error: fetchError } = await supabase
      .from('announcements')
      .select('id, author_id, status')
      .eq('id', params.id)
      .single()

    if (fetchError || !announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    if (announcement.author_id !== userId) {
      return NextResponse.json({ error: 'Only the author can submit for approval' }, { status: 403 })
    }

    if (announcement.status !== 'draft') {
      return NextResponse.json({ error: 'Only drafts can be submitted for approval' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('announcements')
      .update({ status: 'pending_approval' })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
    }

    await adminClient.from('announcement_audit_log').insert({
      announcement_id: params.id,
      actor_id: userId,
      action: 'submitted',
    })

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('Error in POST /api/announcements/[id]/submit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
