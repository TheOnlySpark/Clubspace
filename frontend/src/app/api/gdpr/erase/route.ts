// src/app/api/gdpr/erase/route.ts
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-helpers'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(
  request: Request,
) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) {
      return auth.error
    }

    const { session } = auth
    const userId = session.user.id

    // Step 1: Anonymize PII in the profiles table
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        first_name: null,
        last_name: null,
        student_number: null,
        avatar_url: null,
        active: false, // mark as inactive
      })
      .eq('id', userId)

    if (profileError) {
      throw profileError
    }

    // Step 2: Update or create a GDPR request for erasure
    // We'll set the status to 'complete' and completed_at to now()
    // We use upsert on (user_id, type) to avoid duplicates
    const { error: gdprError } = await adminClient
      .from('gdpr_requests')
      .upsert(
        {
          user_id: userId,
          type: 'erasure',
          status: 'complete',
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id, type' }
      )

    if (gdprError) {
      throw gdprError
    }

    return NextResponse.json(
      { message: 'GDPR erasure request processed successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error in POST /api/gdpr/erase:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}