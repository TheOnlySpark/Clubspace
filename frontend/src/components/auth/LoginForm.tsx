// src/components/auth/LoginForm.tsx
"use client"
import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginForm() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const parsed = loginSchema.parse({ email, password })
      // Call Supabase directly
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: parsed.email,
        password: parsed.password,
      })

      if (authError) {
        throw new Error(authError.message)
      }

      // On success, do a hard redirect to ensure cookies are sent to the server correctly
      window.location.href = next || '/dashboard'
    } catch (err: any) {
      setError(err.message ?? 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-muted-foreground">
          Email address
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@university.ac.za"
          required
          className={cn('w-full', error ? 'border-destructive' : '')}
          autoComplete="email"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-muted-foreground">
          Password
        </label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            placeholder="password"
            required
            className={cn('w-full pr-10', error ? 'border-destructive' : '')}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground text-center">
          Forgot your password? Please contact your administrator.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  )
}