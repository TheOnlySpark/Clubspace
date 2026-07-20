export const dynamic = 'force-dynamic'
// src/app/api/superadmin/users/route.ts
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

    // Fetch all users with their profiles
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        student_number,
        department_id,
        universities!inner(id, name)
      `)
      .order('created_at', { ascending: false })

    if (usersError) throw usersError

    // Fetch user roles separately to avoid PostgREST relationship errors
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role')

    if (rolesError) throw rolesError

    // Map roles by user_id for quick lookup
    const roleMap = new Map(roles.map(r => [r.user_id, r.role]))

    // Transform data to flatten the role and university
    const transformed = users.map((user: any) => ({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      student_number: user.student_number,
      department_id: user.department_id,
      role: roleMap.get(user.id) || 'member',
      university: {
        id: user.universities?.id,
        name: user.universities?.name,
      },
    }))

    return NextResponse.json(transformed, { status: 200 })
  } catch (error: any) {
    console.error('Error in GET /api/superadmin/users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}