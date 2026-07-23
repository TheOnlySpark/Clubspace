// src/components/auth/SessionManager.tsx
"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const INACTIVITY_TIMEOUT_MS = 45 * 1000 // 45 seconds (temporary for testing)

export default function SessionManager() {
  const router = useRouter()

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    const supabase = createClient()

    const handleLogout = async () => {
      await supabase.auth.signOut()
      router.push('/auth/login?reason=timeout')
    }

    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(handleLogout, INACTIVITY_TIMEOUT_MS)
    }

    // Initialize the timer immediately
    resetTimeout()

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    
    // Throttle the activity listener so we aren't clearing/setting timeouts 100x a second on mouse move
    let throttleTimer: NodeJS.Timeout | null = null
    const handleActivity = () => {
      if (throttleTimer) return
      throttleTimer = setTimeout(() => {
        resetTimeout()
        throttleTimer = null
      }, 1000) // Throttle to max 1 update per second
    }

    events.forEach(event => window.addEventListener(event, handleActivity))

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (throttleTimer) clearTimeout(throttleTimer)
      events.forEach(event => window.removeEventListener(event, handleActivity))
    }
  }, [router])

  // This component doesn't render any UI
  return null
}
