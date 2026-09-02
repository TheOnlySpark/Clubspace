// src/app/auth/register/page.tsx
"use client"
import * as React from 'react'
import RegisterForm from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 solid-card p-8 md:p-10 rounded-[2rem] animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
        <div className="text-center space-y-2 relative z-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 mb-4 shadow-sm">
            <img src="/logo.png" alt="Campus Crew Logo" className="w-8 h-8 object-contain mix-blend-multiply" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient">Create account</h1>
          <p className="text-muted-foreground">Join your university&apos;s Campus Crew</p>
        </div>
        
        <div className="relative z-10">
          <React.Suspense fallback={<div className="flex justify-center p-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
            <RegisterForm />
          </React.Suspense>
        </div>
        
        <p className="text-center text-sm text-slate-500 mt-8 relative z-10">
          Already have an account? <a href="/auth/login" className="font-semibold text-indigo-700 hover:text-indigo-800 hover:underline transition-colors">Sign in</a>
        </p>
      </div>
    </div>
  )
}