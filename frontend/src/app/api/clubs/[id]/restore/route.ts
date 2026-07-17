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
      return NextResponse.json({ error: 'Forbidden: Only University Admins or Super Admins can restore clubs' }, { status: 403 })
    }

    // Optional: check if the university_admin is restoring a club in their own university
    if (role === 'university_admin') {
      const { data: clubData } = await adminClient
        .from('clubs')
        .select('university_id')
        .eq('id', clubId)
        .single()
      
      if (clubData?.university_id !== userRoleData?.university_id) {
        return NextResponse.json({ error: 'Forbidden: Cannot restore clubs outside your university' }, { status: 403 })
      }
    }

    // Restore using adminClient
    const { error } = await adminClient
      .from('clubs')
      .update({ 
        status: 'active',
        archived_by: null,
        archived_at: null
      })
      .eq('id', clubId)

    if (error) {
      console.error('Error restoring club:', error)
      return NextResponse.json({ error: 'Failed to restore club' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Club restored successfully' }, { status: 200 })
  } catch (error: any) {
    console.error('Error in POST /api/clubs/[id]/restore:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
