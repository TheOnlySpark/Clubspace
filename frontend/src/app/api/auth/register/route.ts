// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { adminClient } from '@/lib/supabase/admin'
import { registerSchema } from '@/lib/validations/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = registerSchema.parse(body)

    const { email, password, first_name, last_name } = parsed

    // Extract domain from email
    const domain = email.split('@')[1]
    if (!domain) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Find university that allows this domain
    const { data: universities, error: uniError } = await adminClient
      .from('universities')
      .select('id, name, domain_allowlist')
      .contains('domain_allowlist', [domain])

    if (uniError) {
      console.error('Error fetching universities:', uniError)
      return NextResponse.json(
        { error: 'Failed to validate email domain' },
        { status: 500 }
      )
    }

    if (!universities || universities.length === 0) {
      return NextResponse.json(
        { error: 'Email domain not allowed for any university' },
        { status: 400 }
      )
    }

    if (universities.length > 1) {
      // This should not happen if domains are unique across universities
      return NextResponse.json(
        { error: 'Multiple universities found for this domain. Please contact support.' },
        { status: 400 }
      )
    }

    const university = universities[0]

    // Create Supabase user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // We'll handle email verification separately; for now auto confirm
      user_metadata: {
        first_name,
        last_name,
      },
    })

    if (authError) {
      console.error('Error creating user:', authError)
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    const userId = authData.user.id

    // Create profile
    const { error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: userId,
        university_id: university.id,
        first_name,
        last_name,
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      // We could delete the user here, but for simplicity we'll just return error
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      )
    }

    // Assign Member role
    const { error: roleError } = await adminClient
      .from('user_roles')
      .insert({
        user_id: userId,
        university_id: university.id,
        role: 'member',
      })

    if (roleError) {
      console.error('Error assigning role:', roleError)
      return NextResponse.json(
        { error: 'Failed to assign role' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'User registered successfully' },
      { status: 201 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}