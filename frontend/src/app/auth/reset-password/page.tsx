// src/app/auth/reset-password/page.tsx
"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ResetPasswordForm from '@/components/auth/ResetPasswordForm'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 md:px-8 lg:px-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <h2 className="text-2xl font-bold text-primary">Loading...</h2>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 md:px-8 lg:px-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <h2 className="text-2xl font-bold text-primary">Invalid request</h2>
          <p className="text-muted-foreground">
            Sorry, this reset password link is invalid or has expired.
          </p>
          <a href="/auth/login" className="font-medium text-primary hover:underline">
            Go to sign in
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 md:px-8 lg:px-12">
      <div className="w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-primary">Reset your password</h2>
        <ResetPasswordForm />
      </div>
    </div>
  )
}