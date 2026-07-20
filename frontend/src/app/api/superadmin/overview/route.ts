export const dynamic = 'force-dynamic'
// src/app/api/superadmin/overview/route.ts
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-helpers'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) {
      return auth.error
    }

    const { supabase } = auth
    const { session } = auth

    // Check if user is super admin
    const { data: superAdminData, error: superAdminError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'super_admin')
      .single()

    if (superAdminError || !superAdminData) {
      return NextResponse.json(
        { error: 'Forbidden: Super admin only' },
        { status: 403 }
      )
    }

    // Fetch counts
    const universitiesCount = await supabase
      .from('universities')
      .select('id', { count: 'exact' })
      .single()

    const usersCount = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .single()

    const clubsCount = await supabase
      .from('clubs')
      .select('id', { count: 'exact' })
      .single()

    const announcementsCount = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      universities: universitiesCount.count ?? 0,
      users: usersCount.count ?? 0,
      clubs: clubsCount.count ?? 0,
      announcements: announcementsCount.count ?? 0,
    }, { status: 200 })
  } catch (error: any) {
    console.error('Error in GET /api/superadmin/overview:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}