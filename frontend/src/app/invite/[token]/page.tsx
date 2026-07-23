// src/app/invite/[token]/page.tsx
"use client"
import * as React from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

export default function InvitePage({ params }: { params: { token: string } }) {
  const [invite, setInvite] = React.useState<any>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isJoining, setIsJoining] = React.useState(false)
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const fetchInvite = async () => {
      try {
        const res = await fetch(`/api/invites/resolve?token=${params.token}`)
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Failed to resolve invite')
        }
        setInvite(data.invite)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    const checkAuth = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      setIsAuthenticated(!!data.session)
    }

    fetchInvite()
    checkAuth()
  }, [params.token])

  const handleJoin = async () => {
    setIsJoining(true)
    setError(null)
    try {
      const res = await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: params.token }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join club')
      }
      // Redirect to the club page or dashboard
      router.refresh()
      router.push(`/dashboard/clubs`) // Or specific club if page exists
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsJoining(false)
    }
  }

  const handleLogin = () => {
    router.push(`/auth/login?next=/invite/${params.token}`)
  }

  const handleRegister = () => {
    router.push(`/auth/register?next=/invite/${params.token}`)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !invite) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 solid-card p-8 text-center rounded-[2rem]">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gradient">Invalid Invite</h1>
          <p className="text-muted-foreground">{error || 'This invite link is invalid or has expired.'}</p>
          <Button onClick={() => router.push('/')} className="mt-4 w-full">
            Go Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-full max-h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 solid-card p-8 md:p-10 rounded-[2rem] animate-in fade-in zoom-in-95 duration-500 relative z-10 text-center">
        {invite.clubs.banner_url ? (
          <img
            src={invite.clubs.banner_url}
            alt={invite.clubs.name}
            className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-background shadow-lg mb-4"
          />
        ) : (
          <div className="w-24 h-24 rounded-full mx-auto bg-primary/10 flex items-center justify-center border-4 border-background shadow-lg mb-4">
            <span className="text-3xl font-bold text-primary">
              {invite.clubs.name.charAt(0)}
            </span>
          </div>
        )}

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gradient">
            Join {invite.clubs.name}
          </h1>
          <p className="text-muted-foreground">
            You&apos;ve been invited to join this club on ClubSpace.
          </p>
        </div>

        {isAuthenticated ? (
          <div className="space-y-4 pt-4">
            <Button
              onClick={handleJoin}
              disabled={isJoining}
              className="w-full"
              size="lg"
            >
              {isJoining ? 'Joining...' : 'Join Club'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Please log in or create an account to join this club.
            </p>
            <Button onClick={handleLogin} className="w-full" size="lg">
              Log In
            </Button>
            <Button onClick={handleRegister} variant="outline" className="w-full" size="lg">
              Register
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
