// src/app/auth/login/page.tsx
"use client"
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12 md:px-8 lg:px-12">
      <div className="w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-primary">Sign in to ClubSpace</h2>
        <LoginForm />
        <p className="text-sm text-muted-foreground">
          Don't have an account? <a href="/auth/register" className="font-medium text-primary hover:underline">Sign up</a>
        </p>
      </div>
    </div>
  )
}