// src/app/auth/forgot-password/page.tsx
"use client"
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 md:px-8 lg:px-12">
      <div className="w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-primary">Forgot your password?</h2>
        <ForgotPasswordForm />
        <p className="text-sm text-muted-foreground">
          Remember your password? <a href="/auth/login" className="font-medium text-primary hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  )
}