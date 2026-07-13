// src/hooks/useNotifications.ts
// Updated to use announcement_reads instead of the old notifications table.
// This hook now tracks unread published announcements for the current user.
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface NotificationItem {
  id: string
  title: string
  body: string
  created_at: string
  is_read: boolean
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setNotifications([])
        setUnreadCount(0)
        setLoading(false)
        return
      }

      // Get recent published announcements the user can see (RLS handles scoping)
      const { data: announcements, error: annError } = await supabase
        .from('announcements')
        .select('id, title, body, created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(20)

      if (annError) throw annError

      // Get which ones the user has already read
      const ids = (announcements || []).map(a => a.id)
      const { data: reads } = await supabase
        .from('announcement_reads')
        .select('announcement_id')
        .eq('user_id', session.user.id)
        .in('announcement_id', ids.length > 0 ? ids : ['00000000-0000-0000-0000-000000000000'])

      const readSet = new Set((reads || []).map(r => r.announcement_id))

      const items: NotificationItem[] = (announcements || []).map(a => ({
        id: a.id,
        title: a.title,
        body: a.body,
        created_at: a.created_at,
        is_read: readSet.has(a.id),
      }))

      setNotifications(items)
      setUnreadCount(items.filter(n => !n.is_read).length)
      setError(null)
    } catch (err: any) {
      console.error('Error fetching notifications:', err)
      setError(err.message ?? 'Failed to fetch')
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsRead = async (announcementId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      await supabase
        .from('announcement_reads')
        .upsert(
          { announcement_id: announcementId, user_id: session.user.id, read_at: new Date().toISOString() },
          { onConflict: 'announcement_id,user_id' }
        )

      setNotifications(prev =>
        prev.map(n => n.id === announcementId ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err: any) {
      console.error('Error marking as read:', err)
    }
  }

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read)
    for (const n of unread) {
      await markAsRead(n.id)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
  }
}