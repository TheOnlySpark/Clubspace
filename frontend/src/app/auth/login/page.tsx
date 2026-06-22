// src/app/auth/login/page.tsx
"use client"
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 glass-card p-8 md:p-10 rounded-[2rem] animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="text-center space-y-2 relative z-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 mb-4 shadow-inner">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient">Welcome back</h1>
          <p className="text-muted-foreground">Sign in to your ClubSpace account</p>
        </div>
        
        <div className="relative z-10">
          <LoginForm />
        </div>
        
        <p className="text-center text-sm text-muted-foreground mt-8 relative z-10">
          Don&apos;t have an account? <a href="/auth/register" className="font-semibold text-primary hover:text-accent hover:underline transition-colors">Sign up</a>
        </p>
      </div>
    </div>
  )
}