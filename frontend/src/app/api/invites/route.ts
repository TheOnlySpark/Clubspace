export const dynamic = 'force-dynamic'
// src/app/api/invites/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/api-helpers'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

// Schema for creating an invite link
const inviteLinkSchema = z.object({
  expires_at: z.string().datetime().optional(),
  max_uses: z.number().int().nonnegative().optional(),
})

export async function GET(request: Request) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) {
      return auth.error
    }

    const { supabase } = auth
    const { searchParams } = new URL(request.url)

    // Get query parameters for filtering
    const clubId = searchParams.get('clubId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Start building the query
    let query = supabase.from('invite_links').select(`
      *,
      clubs!inner(name)
    `, { count: 'exact' })

    // Apply filters
    if (clubId) {
      query = query.eq('club_id', clubId)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    // Order by creation date
    query = query.order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching invite links:', error)
      return NextResponse.json(
        { error: 'Failed to fetch invite links' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { invite_links: data, count },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in GET /api/invites:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) {
      return auth.error
    }

    const { supabase } = auth
    const body = await request.json()

    // Validate the invite link data
    const parsed = inviteLinkSchema.parse(body)

    // Get the user's profile to get their club context (we need to know which club they are creating the invite for)
    // For simplicity, we'll assume the user is creating an invite for a club they are a member of.
    // We'll get the user's memberships and let them specify the clubId in the body? Or we can get it from the context.
    // Since we don't have a club selector in the API, we'll require the clubId in the body.
    // We'll update the schema to include clubId.

    // Let's adjust: we'll require clubId in the body and validate that the user is a member of that club.

    // We'll update the schema to include clubId.
    // But we already parsed the body with inviteLinkSchema, so we need to change the schema.

    // Let's redefine the schema to include clubId.

    // We'll do it by creating a new schema that extends inviteLinkSchema with clubId.

    const inviteLinkWithClubSchema = z.object({
      clubId: z.string().uuid('Invalid club ID'),
      expires_at: z.string().datetime().optional(),
      max_uses: z.number().int().nonnegative().optional(),
    })

    const parsedWithClub = inviteLinkWithClubSchema.parse(body)

    const { clubId, expires_at, max_uses } = parsedWithClub

    // Verify the user is a member of the club
    const { data: membershipData, error: membershipError } = await supabase
      .from('club_memberships')
      .select('role')
      .eq('club_id', clubId)
      .eq('user_id', auth.session.user.id)
      .single()

    if (membershipError) {
      // If no membership found, the user is not a member of the club
      return NextResponse.json(
        { error: 'You are not a member of this club' },
        { status: 403 }
      )
    }

    // Optionally, we can check if the user has permission to create invites (e.g., club admin or officer)
    // For simplicity, we'll allow any member to create invites.
    // If we want to restrict, we can check the role.

    // Generate a token for the invite link
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    // Insert the invite link into the database
    const { data: newInvite, error: insertError } = await supabase
      .from('invite_links')
      .insert({
        club_id: clubId,
        token,
        expires_at: expires_at || null,
        max_uses: max_uses || null,
        use_count: 0,
        revoked: false,
        created_by: auth.session.user.id,
      })
      .select()
      .single()

    if (insertError || !newInvite) {
      console.error('Error inserting invite link:', insertError)
      return NextResponse.json(
        { error: 'Failed to create invite link' },
        { status: 500 }
      )
    }

    return NextResponse.json(newInvite, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || 'Validation error' },
        { status: 400 }
      )
    }
    console.error('Error in POST /api/invites:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}