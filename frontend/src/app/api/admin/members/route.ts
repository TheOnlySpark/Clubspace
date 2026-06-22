// src/app/api/admin/members/route.ts
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

    // Get user's profile to get university_id
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('university_id, id')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profileData) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 400 }
      )
    }

    const universityId = profileData.university_id

    // Check if user is university admin or super admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('university_id', universityId)
      .eq('role', 'university_admin')
      .limit(1)
      .maybeSingle()

    const isUniversityAdmin = roleData?.role === 'university_admin'
    
    const { data: superAdminData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'super_admin')
      .limit(1)
      .maybeSingle()

    const isSuperAdmin = superAdminData?.role === 'super_admin'

    if (!(isUniversityAdmin || isSuperAdmin)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to manage members' },
        { status: 403 }
      )
    }

    // Fetch members (profiles) for the university
    const { data: members, error: membersError } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        student_number,
        department_id,
        active,
        created_at,
        departments(name)
      `)
      .eq('university_id', universityId)
      .order('created_at', { ascending: false })

    if (membersError) {
      throw membersError
    }

    // Fetch roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .eq('university_id', universityId)

    if (rolesError) throw rolesError

    const roleMap = new Map(roles.map(r => [r.user_id, r.role]))

    // Transform data
    const transformed = members.map((member: any) => ({
      id: member.id,
      first_name: member.first_name,
      last_name: member.last_name,
      student_number: member.student_number,
      department: member.departments?.name,
      active: member.active,
      created_at: member.created_at,
      role: roleMap.get(member.id) || 'member', // fallback to member if missing
    }))

    return NextResponse.json(transformed, { status: 200 })
  } catch (error: any) {
    console.error('Error in GET /api/admin/members:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}