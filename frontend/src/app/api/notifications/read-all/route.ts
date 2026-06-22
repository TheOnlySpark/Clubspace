// src/app/api/notifications/read-all/route.ts
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-helpers'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) {
      return auth.error
    }

    const { supabase } = auth

    // Update all notifications for the user to read = true
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', auth.session.user.id)

    if (error) {
      console.error('Error marking notifications as read:', error)
      return NextResponse.json(
        { error: 'Failed to mark notifications as read' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'All notifications marked as read' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in POST /api/notifications/read-all:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}