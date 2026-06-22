// src/app/auth/verify-email/page.tsx
"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function VerifyEmailPage() {
  const router = useRouter()

  useEffect(() => {
    // In a real app, we would check the token from URL and verify
    // For now, just redirect to dashboard after a short delay
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 md:px-8 lg:px-12">
      <div className="w-full max-w-md space-y-6 text-center">
        <h2 className="text-2xl font-bold text-primary">Verify your email</h2>
        <p className="text-muted-foreground">
          We've sent a verification link to your email. Please check your inbox and click the link to verify your account.
        </p>
        <p className="text-xs text-muted-foreground">
          If you don't see the email, check your spam folder.
        </p>
      </div>
    </div>
  )
}