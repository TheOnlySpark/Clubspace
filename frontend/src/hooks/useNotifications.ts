// src/hooks/useNotifications.ts
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/types/index'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      // Get the current user's notifications
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setNotifications([])
        setUnreadCount(0)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setNotifications(data || [])
      setUnreadCount(
        (data || []).filter((n) => !n.read).length
      )
      setError(null)
    } catch (err: any) {
      console.error('Error fetching notifications:', err)
      setError(err.message ?? 'Failed to fetch notifications')
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) {
        throw error
      }

      // Update the notifications list optimistically
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err: any) {
      console.error('Error marking notification as read:', err)
      // Optionally show a toast or something
    }
  }

  const markAllAsRead = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', session.user.id)

      if (error) {
        throw error
      }

      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err)
    }
  }

  // Fetch notifications on mount and when we want to refetch
  useEffect(() => {
    fetchNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // We could also subscribe to real-time changes, but for simplicity we'll just fetch on mount.
  // In a real app, we might want to subscribe to insert/update on notifications.

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