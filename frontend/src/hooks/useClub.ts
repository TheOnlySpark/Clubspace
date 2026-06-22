// src/hooks/useClub.ts
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Club } from '@/types/index'

export function useClub(clubId: string | null) {
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!clubId) {
      setClub(null)
      setLoading(false)
      return
    }

    const supabase = createClient()

    const fetchClub = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .single()

      if (error) {
        console.error('Error fetching club:', error)
        setError(error.message)
        setClub(null)
      } else {
        setClub(data)
        setError(null)
      }
      setLoading(false)
    }

    fetchClub()
  }, [clubId])

  return { club, loading, error }
}