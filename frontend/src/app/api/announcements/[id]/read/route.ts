// src/app/api/announcements/[id]/read/route.ts
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-helpers'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { supabase } = auth
    const userId = auth.session.user.id

    // Upsert read receipt (idempotent)
    const { error } = await supabase
      .from('announcement_reads')
      .upsert(
        {
          announcement_id: params.id,
          user_id: userId,
          read_at: new Date().toISOString(),
        },
        { onConflict: 'announcement_id,user_id' }
      )

    if (error) {
      console.error('Error marking as read:', error)
      return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Error in POST /api/announcements/[id]/read:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
