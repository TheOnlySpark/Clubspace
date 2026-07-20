export const dynamic = 'force-dynamic'
// src/app/api/admin/announcement-settings/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/api-helpers'
import { announcementSettingsSchema } from '@/lib/validations/announcements'

export async function GET() {
  try {
    const auth = await requireRole('university_admin')
    if ('error' in auth) return auth.error

    const { supabase, session } = auth

    // Get university_id from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('university_id')
      .eq('id', session.user.id)
      .single()

    if (!profile?.university_id) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('announcement_settings')
      .select('*')
      .eq('university_id', profile.university_id)
      .single()

    if (error && error.code === 'PGRST116') {
      // No settings row yet — return defaults
      return NextResponse.json({
        university_id: profile.university_id,
        require_approval_for_officers: true,
        max_pinned_per_club: 1,
        allow_club_public_visibility: false,
        retention_days: 365,
        branding_color: '#2563EB',
      }, { status: 200 })
    }

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('Error in GET /api/admin/announcement-settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireRole('university_admin')
    if ('error' in auth) return auth.error

    const { supabase, session } = auth
    const body = await request.json()
    const parsed = announcementSettingsSchema.parse(body)

    const { data: profile } = await supabase
      .from('profiles')
      .select('university_id')
      .eq('id', session.user.id)
      .single()

    if (!profile?.university_id) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 400 })
    }

    // Upsert settings
    const { data, error } = await supabase
      .from('announcement_settings')
      .upsert(
        {
          university_id: profile.university_id,
          ...parsed,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'university_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('Error updating settings:', error)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 })
    }
    console.error('Error in PATCH /api/admin/announcement-settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
