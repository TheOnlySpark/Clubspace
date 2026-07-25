// src/app/auth/verify-email/page.tsx
"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function VerifyEmailPage() {
  const router = useRouter()

  useEffect(() => {
    // Automatically redirect the user to login after a short delay
    const timer = setTimeout(() => {
      router.push('/auth/login')
    }, 3000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 md:px-8 lg:px-12">
      <div className="w-full max-w-md space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100/50 dark:bg-green-900/20 mb-4 border border-green-200 dark:border-green-800">
          <svg className="h-10 w-10 text-green-600 dark:text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Email Verified!</h2>
        <p className="text-lg text-muted-foreground">
          Your account has been successfully verified. Welcome to Clubspace!
        </p>
        <div className="flex flex-col items-center justify-center space-y-3 pt-6">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary border-t-transparent"></div>
          <p className="text-sm font-medium text-muted-foreground">
            Redirecting you to login...
          </p>
        </div>
      </div>
    </div>
  )
}