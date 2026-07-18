// src/hooks/useRole.ts
import useSWR from 'swr'
import { useAuth } from './useAuth'
import { createClient } from '@/lib/supabase/client'

const fetchRole = async (userId: string) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_roles')
    .select('role, university_id')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching role:', error)
    return null
  }
  
  if (data && data.length > 0) {
    const roleWeights: Record<string, number> = {
      super_admin: 1,
      university_admin: 2,
      club_admin: 3,
      officer: 4,
      member: 5
    }
    
    data.sort((a, b) => (roleWeights[a.role] || 99) - (roleWeights[b.role] || 99))
    return data[0].role
  }
  
  return null
}

export function useRole() {
  const { user, loading: authLoading } = useAuth()
  
  const { data: role, isLoading } = useSWR(
    user && !authLoading ? `role-${user.id}` : null,
    () => fetchRole(user!.id),
    {
      revalidateOnFocus: false, // Prevents unnecessary refetching
      dedupingInterval: 60000,  // Cache for 1 minute before checking again
    }
  )

  const loading = authLoading || isLoading

  const isAdmin = () => role === 'club_admin' || role === 'university_admin' || role === 'super_admin'
  const isSuperAdmin = () => role === 'super_admin'
  const isUniversityAdmin = () => role === 'university_admin'
  const isClubAdmin = () => role === 'club_admin'

  return {
    role: role || null,
    loading,
    isAdmin,
    isSuperAdmin,
    isUniversityAdmin,
    isClubAdmin,
  }
}