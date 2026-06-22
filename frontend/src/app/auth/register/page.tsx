// src/app/auth/register/page.tsx
"use client"
import RegisterForm from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 glass-card p-8 md:p-10 rounded-[2rem] animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="text-center space-y-2 relative z-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 mb-4 shadow-inner">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient">Create account</h1>
          <p className="text-muted-foreground">Join your university&apos;s ClubSpace</p>
        </div>
        
        <div className="relative z-10">
          <RegisterForm />
        </div>
        
        <p className="text-center text-sm text-muted-foreground mt-8 relative z-10">
          Already have an account? <a href="/auth/login" className="font-semibold text-primary hover:text-accent hover:underline transition-colors">Sign in</a>
        </p>
      </div>
    </div>
  )
}