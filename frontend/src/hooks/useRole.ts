// src/hooks/useRole.ts
import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { createClient } from '@/lib/supabase/client'

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

      if (error) {
        console.error('Error fetching role:', error)
        setRole(null)
      } else if (data && data.length > 0) {
        const roleWeights: Record<string, number> = {
          super_admin: 1,
          university_admin: 2,
          club_admin: 3,
          officer: 4,
          member: 5
        }
        
        data.sort((a, b) => (roleWeights[a.role] || 99) - (roleWeights[b.role] || 99))
        setRole(data[0].role)
      } else {
        setRole(null)
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