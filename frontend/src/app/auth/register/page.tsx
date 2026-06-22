// src/app/auth/register/page.tsx
"use client"
import RegisterForm from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 md:px-8 lg:px-12">
      <div className="w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-primary">Create your account</h2>
        <RegisterForm />
        <p className="text-sm text-muted-foreground">
          Already have an account? <a href="/auth/login" className="font-medium text-primary hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  )
}