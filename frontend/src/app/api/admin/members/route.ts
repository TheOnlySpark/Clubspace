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
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('university_id', universityId)
      .single()

    const isUniversityAdmin = roleData?.role === 'university_admin'
    const { data: superAdminData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'super_admin')
      .single()

    const isSuperAdmin = superAdminData?.role === 'super_admin'

    if (!(isUniversityAdmin || isSuperAdmin)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to manage members' },
        { status: 403 }
      )
    }

    // Fetch members (profiles) for the university with their roles
    // We'll join profiles with user_roles to get the role
    const query = supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        student_number,
        department_id,
        user_roles!inner(role)
      `)
      .eq('university_id', universityId)

    // If super admin, we might want to fetch all users across universities? We'll restrict to the user's university for consistency.
    // For super admin managing a specific university, we still need to specify which university.
    // We'll keep it as the user's university (the one they belong to). If super admin wants to manage another university, they'd need to switch context.
    // For simplicity, we'll stick to the user's university.

    const { data: members, error: membersError } = await query
      .order('created_at', { ascending: false })

    if (membersError) {
      throw membersError
    }

    // Transform data to flatten the role
    const transformed = members.map((member: any) => ({
      id: member.id,
      first_name: member.first_name,
      last_name: member.last_name,
      student_number: member.student_number,
      department_id: member.department_id,
      role: member.user_roles?.role || 'member', // fallback to member if missing
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