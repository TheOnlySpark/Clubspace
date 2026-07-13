// src/hooks/useAnnouncements.ts
"use client"
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import type { Announcement } from '@/types'

interface UseAnnouncementsOptions {
  clubId?: string | null
  status?: string
  pinned?: boolean
  limit?: number
}

export function useAnnouncements(options: UseAnnouncementsOptions = {}) {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnnouncements = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (options.clubId) params.set('clubId', options.clubId)
      if (options.status) params.set('status', options.status)
      if (options.pinned) params.set('pinned', 'true')
      if (options.limit) params.set('limit', String(options.limit))

      const res = await fetch(`/api/announcements?${params.toString()}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch announcements')
      }

      const data = await res.json()
      setAnnouncements(data.announcements || [])
      setCount(data.count || 0)
    } catch (err: any) {
      setError(err.message)
      setAnnouncements([])
    } finally {
      setLoading(false)
    }
  }, [user, options.clubId, options.status, options.pinned, options.limit])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  const createAnnouncement = async (data: any) => {
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to create')
    }
    const result = await res.json()
    await fetchAnnouncements()
    return result
  }

  const deleteAnnouncement = async (id: string) => {
    const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to delete')
    }
    await fetchAnnouncements()
  }

  const submitForApproval = async (id: string) => {
    const res = await fetch(`/api/announcements/${id}/submit`, { method: 'POST' })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to submit')
    }
    await fetchAnnouncements()
  }

  const approve = async (id: string) => {
    const res = await fetch(`/api/announcements/${id}/approve`, { method: 'POST' })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to approve')
    }
    await fetchAnnouncements()
  }

  const reject = async (id: string, reason?: string) => {
    const res = await fetch(`/api/announcements/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejection_reason: reason }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to reject')
    }
    await fetchAnnouncements()
  }

  const togglePin = async (id: string) => {
    const res = await fetch(`/api/announcements/${id}/pin`, { method: 'POST' })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Failed to toggle pin')
    }
    await fetchAnnouncements()
  }

  const markAsRead = async (id: string) => {
    await fetch(`/api/announcements/${id}/read`, { method: 'POST' })
  }

  return {
    announcements,
    count,
    loading,
    error,
    refetch: fetchAnnouncements,
    createAnnouncement,
    deleteAnnouncement,
    submitForApproval,
    approve,
    reject,
    togglePin,
    markAsRead,
  }
}
