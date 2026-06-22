// src/app/api/superadmin/universities/route.ts
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

    // Fetch all universities
    const { data: universities, error: universitiesError } = await supabase
      .from('universities')
      .select('id, name, slug, created_at')
      .order('created_at', { ascending: false })

    if (universitiesError) {
      throw universitiesError
    }

    return NextResponse.json(universities, { status: 200 })
  } catch (error: any) {
    console.error('Error in GET /api/superadmin/universities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}