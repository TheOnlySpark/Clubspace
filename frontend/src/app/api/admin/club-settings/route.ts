export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-helpers'
import { createClient } from '@/lib/supabase/server'
import { clubSettingsSchema } from '@/lib/validations/clubs'

export async function GET(request: Request) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { supabase } = auth
    
    // Check if user is university admin or super admin
    const { data: userRoleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', auth.session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!['university_admin', 'super_admin'].includes(userRoleData?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('university_id')
      .eq('id', auth.session.user.id)
      .single()

    if (!profile?.university_id) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('club_settings')
      .select('*')
      .eq('university_id', profile.university_id)
      .single()

    if (error && error.code !== 'PGRST116') { // Ignore not found error, just return defaults
      console.error('Error fetching club settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // Default settings if none exist
    const settings = data || {
      require_contact_email: true,
      require_description: false,
      allow_club_admin_logo_change: true
    }

    return NextResponse.json(settings, { status: 200 })
  } catch (error: any) {
    console.error('Error in GET /api/admin/club-settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { supabase } = auth
    
    // Check if user is university admin or super admin
    const { data: userRoleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', auth.session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!['university_admin', 'super_admin'].includes(userRoleData?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('university_id')
      .eq('id', auth.session.user.id)
      .single()

    if (!profile?.university_id) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 400 })
    }

    const body = await request.json()
    const parsed = clubSettingsSchema.partial().parse(body)

    // Try to update existing, or insert if not exists (upsert-like behavior since university_id is PK)
    const { data, error } = await supabase
      .from('club_settings')
      .upsert({
        university_id: profile.university_id,
        ...parsed,
        updated_at: new Date().toISOString()
      }, { onConflict: 'university_id' })
      .select()
      .single()

    if (error) {
      console.error('Error updating club settings:', error)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Validation failed' }, { status: 400 })
    }
    console.error('Error in PATCH /api/admin/club-settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
