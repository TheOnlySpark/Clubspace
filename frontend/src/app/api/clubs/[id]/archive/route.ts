import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-helpers'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { id: clubId } = params

    if (!clubId) {
      return NextResponse.json({ error: 'Club ID is required' }, { status: 400 })
    }

    // Check if the user is a university admin or super admin
    const { data: userRoleData } = await adminClient
      .from('user_roles')
      .select('role, university_id')
      .eq('user_id', auth.session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const role = userRoleData?.role
    if (role !== 'university_admin' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Only University Admins or Super Admins can archive clubs' }, { status: 403 })
    }

    // Optional: check if the university_admin is archiving a club in their own university
    if (role === 'university_admin') {
      const { data: clubData } = await adminClient
        .from('clubs')
        .select('university_id')
        .eq('id', clubId)
        .single()
      
      if (clubData?.university_id !== userRoleData?.university_id) {
        return NextResponse.json({ error: 'Forbidden: Cannot archive clubs outside your university' }, { status: 403 })
      }
    }

    // Archive using adminClient
    const { error } = await adminClient
      .from('clubs')
      .update({ 
        status: 'archived',
        archived_by: auth.session.user.id,
        archived_at: new Date().toISOString()
      })
      .eq('id', clubId)

    if (error) {
      console.error('Error archiving club:', error)
      return NextResponse.json({ error: 'Failed to archive club' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Club archived successfully' }, { status: 200 })
  } catch (error: any) {
    console.error('Error in POST /api/clubs/[id]/archive:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
