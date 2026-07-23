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
      console.log('Inactivity timeout reached! Logging out...')
      try {
        await supabase.auth.signOut()
      } catch (err) {
        console.error('Logout error:', err)
      } finally {
        window.location.href = '/auth/login?reason=timeout'
      }
    }

    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(handleLogout, INACTIVITY_TIMEOUT_MS)
    }

    // Initialize the timer immediately
    resetTimeout()

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    
    // Throttle the activity listener using a timestamp
    let lastActivity = Date.now()
    const handleActivity = () => {
      const now = Date.now()
      // Only reset the timer if it's been at least 1 second since the last reset
      if (now - lastActivity > 1000) {
        lastActivity = now
        resetTimeout()
      }
    }

    events.forEach(event => window.addEventListener(event, handleActivity))

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      events.forEach(event => window.removeEventListener(event, handleActivity))
    }
  }, [router])

  // This component doesn't render any UI
  return null
}
