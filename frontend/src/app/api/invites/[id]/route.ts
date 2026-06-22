// src/app/api/invites/[id]/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-helpers'
import { createClient } from '@/lib/supabase/server'

// Schema for updating an invite link
const inviteLinkUpdateSchema = z.object({
  expires_at: z.string().datetime().optional().nullable(),
  max_uses: z.number().int().nonnegative().optional(),
  revoked: z.boolean().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) {
      return auth.error
    }

    const { supabase } = auth
    const { id: inviteId } = params

    if (!inviteId) {
      return NextResponse.json(
        { error: 'Invite ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('invite_links')
      .select(`
        *,
        clubs!inner(name)
      `)
      .eq('id', inviteId)
      .single()

    if (error) {
      console.error('Error fetching invite link:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Invite link not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to fetch invite link' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    console.error('Error in GET /api/invites/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) {
      return auth.error
    }

    const { supabase } = auth
    const { id: inviteId } = params

    if (!inviteId) {
      return NextResponse.json(
        { error: 'Invite ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    // Partial update
    const parsed = inviteLinkUpdateSchema.parse(body)

    // Verify the user has permission to update this invite link
    // They must be a member of the club that the invite belongs to
    const { data: inviteData, error: inviteError } = await supabase
      .from('invite_links')
      .select('club_id, created_by')
      .eq('id', inviteId)
      .single()

    if (inviteError || !inviteData) {
      return NextResponse.json(
        { error: 'Invite link not found' },
        { status: 404 }
      )
    }

    // Check if the user is a member of the club
    const { data: membershipData, error: membershipError } = await supabase
      .from('club_memberships')
      .select('role')
      .eq('club_id', inviteData.club_id)
      .eq('user_id', auth.session.user.id)
      .single()

    if (membershipError) {
      // If no membership found, the user is not a member of the club
      return NextResponse.json(
        { error: 'You are not a member of this club' },
        { status: 403 }
      )
    }

    // Optionally, we can check if the user has permission to update invites (e.g., they created it or are an admin)
    // For simplicity, we'll allow any member of the club to update the invite.

    // Update the invite link
    const { data, error } = await supabase
      .from('invite_links')
      .update(parsed)
      .eq('id', inviteId)
      .select()
      .single()

    if (error) {
      console.error('Error updating invite link:', error)
      return NextResponse.json(
        { error: 'Failed to update invite link' },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Validation error' },
        { status: 400 }
      )
    }
    console.error('Error in PATCH /api/invites/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) {
      return auth.error
    }

    const { supabase } = auth
    const { id: inviteId } = params

    if (!inviteId) {
      return NextResponse.json(
        { error: 'Invite ID is required' },
        { status: 400 }
      )
    }

    // Verify the user has permission to delete this invite link
    // Similar to PATCH, but we might be more restrictive (only the creator or admins)
    const { data: inviteData, error: inviteError } = await supabase
      .from('invite_links')
      .select('club_id, created_by')
      .eq('id', inviteId)
      .single()

    if (inviteError || !inviteData) {
      return NextResponse.json(
        { error: 'Invite link not found' },
        { status: 404 }
      )
    }

    // Check if the user is the creator of the invite
    const isCreator = inviteData.created_by === auth.session.user.id

    // Check if the user is a member of the club (and maybe an admin)
    const { data: membershipData, error: membershipError } = await supabase
      .from('club_memberships')
      .select('role')
      .eq('club_id', inviteData.club_id)
      .eq('user_id', auth.session.user.id)
      .single()

    if (membershipError) {
      // If no membership found, the user is not a member of the club
      return NextResponse.json(
        { error: 'You are not a member of this club' },
        { status: 403 }
      )
    }

    // For simplicity, we'll allow the creator or any club admin to delete the invite.
    // We'll check if the user is a club admin or officer.
    const { data: clubData, error: clubError } = await supabase
      .from('clubs')
      .select('id, university_id')
      .eq('id', inviteData.club_id)
      .single()

    if (clubError || !clubData) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      )
    }

    // Get the user's role in the club
    const { data: userRoleData, error: userRoleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', auth.session.user.id)
      .eq('university_id', clubData.university_id)
      .single()

    const isClubAdminOrOfficer = userRoleData?.role === 'admin' || userRoleData?.role === 'officer'

    if (!(isCreator || isClubAdminOrOfficer)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to delete this invite link' },
        { status: 403 }
      )
    }

    // Delete the invite link
    const { error } = await supabase
      .from('invite_links')
      .delete()
      .eq('id', inviteId)

    if (error) {
      console.error('Error deleting invite link:', error)
      return NextResponse.json(
        { error: 'Failed to delete invite link' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Invite link deleted successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in DELETE /api/invites/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}