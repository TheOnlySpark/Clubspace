// src/hooks/useRole.ts
import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types/index'

export function useRole() {
  const { user, loading: authLoading } = useAuth()
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || authLoading) {
      setRole(null)
      setLoading(false)
      return
    }

    const supabase = createClient()

    const fetchRole = async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, university_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }) // Get the most recent role if multiple
        .limit(1)

      if (error) {
        console.error('Error fetching role:', error)
        setRole(null)
      } else {
        // We'll take the first role (highest priority due to ordering)
        setRole(data?.[0]?.role ?? null)
      }
      setLoading(false)
    }

    fetchRole()
  }, [user, authLoading])

  const isAdmin = () => role === 'club_admin' || role === 'university_admin' || role === 'super_admin'
  const isSuperAdmin = () => role === 'super_admin'
  const isUniversityAdmin = () => role === 'university_admin'
  const isClubAdmin = () => role === 'club_admin'

  return {
    role,
    loading,
    isAdmin,
    isSuperAdmin,
    isUniversityAdmin,
    isClubAdmin,
  }
}