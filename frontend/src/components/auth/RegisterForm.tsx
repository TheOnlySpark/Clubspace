// src/components/auth/RegisterForm.tsx
"use client"
import * as React from 'react'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
})

export default function RegisterForm() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [firstName, setFirstName] = React.useState('')
  const [lastName, setLastName] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const parsed = registerSchema.parse({ email, password, first_name: firstName, last_name: lastName })
      // Call API
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      })

      if (!res.ok) {
        let errorMessage = 'Registration failed'
        const contentType = res.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json()
          errorMessage = errorData.error || errorMessage
        } else {
          // It's likely an HTML error page from the server crashing
          errorMessage = 'Server error: Invalid response from server. Please check your configuration.'
        }
        throw new Error(errorMessage)
      }

      // On success, show verification message instead of auto-logging in
      setIsSuccess(true)
    } catch (err: any) {
      setError(err.message ?? 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center space-y-4 py-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-2 border border-primary/20">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold">Check your email</h3>
        <p className="text-muted-foreground">
          We've sent a verification link to <br/><span className="font-medium text-foreground">{email}</span>.
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          Please click the link to verify your account before logging in.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-muted-foreground">
          First name
        </label>
        <Input
          id="firstName"
          type="text"
          value={firstName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
          placeholder="First name"
          required
          className={cn('w-full', error ? 'border-destructive' : '')}
        />
      </div>
      <div>
        <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-muted-foreground">
          Last name
        </label>
        <Input
          id="lastName"
          type="text"
          value={lastName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
          placeholder="Last name"
          required
          className={cn('w-full', error ? 'border-destructive' : '')}
        />
      </div>
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-muted-foreground">
          Email address
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          placeholder="you@university.ac.za"
          required
          className={cn('w-full', error ? 'border-destructive' : '')}
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-muted-foreground">
          Password
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          placeholder="password"
          required
          className={cn('w-full', error ? 'border-destructive' : '')}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  )
}