// src/app/api/notifications/route.ts
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-helpers'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) {
      return auth.error
    }

    const { supabase } = auth
    const { searchParams } = new URL(request.url)

    // Get query parameters for filtering
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    // Start building the query
    let query = supabase.from('notifications').select(`
      *,
      announcements!inner(title, body, clubs!inner(name))
    `, { count: 'exact' })

    // Apply filters
    query = query.eq('user_id', auth.session.user.id)

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    // Order by creation date
    query = query.order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { notifications: data, count },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in GET /api/notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}