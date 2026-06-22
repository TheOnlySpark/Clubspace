// src/lib/api-helpers.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ROLE_HIERARCHY = ['member','officer','club_admin','university_admin','super_admin']

export async function requireAuth() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { error: NextResponse.json({ error: 'Unauthorised' }, { status: 401 }) }
  return { session, supabase }
}

export async function requireRole(minRole: string) {
  const auth = await requireAuth()
  if ('error' in auth) return auth
  const { data: roleData } = await auth.supabase
    .from('user_roles').select('role').eq('user_id', auth.session.user.id).single()
  if (!roleData || ROLE_HIERARCHY.indexOf(roleData.role) < ROLE_HIERARCHY.indexOf(minRole)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { session: auth.session, supabase: auth.supabase, role: roleData.role }
}