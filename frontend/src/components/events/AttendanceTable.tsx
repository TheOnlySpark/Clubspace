// src/components/events/AttendanceTable.tsx
"use client"
import * as React from 'react'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import { Table, Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table'
import { createClient } from '@/lib/supabase/client'

interface AttendanceTableProps {
  eventId: string
}

export default function AttendanceTable({ eventId }: AttendanceTableProps) {
  const [attendees, setAttendees] = useState<Array<any>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Fetch current user ID
  React.useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setCurrentUserId(session.user.id)
        }
      } catch (err) {
        console.error('Error fetching session:', err)
      }
    }
    fetchCurrentUser()
  }, [])

  // Fetch attendees for the event
  React.useEffect(() => {
    attendEvent(eventId)
  }, [eventId])

  const attendEvent = async (eventId: string) => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }

      // Get attendees for this event
      const { data, error } = await supabase
        .from('event_attendance')
        .select('user_id, profiles!inner(first_name, last_name, email), marked_at')
        .eq('event_id', eventId)
        .order('marked_at', { ascending: false })

      if (error) {
        throw error
      }

      const formatted = data.map((att: any) => ({
        id: att.user_id,
        first_name: att.profiles.first_name,
        last_name: att.profiles.last_name,
        email: att.profiles.email,
        marked_at: att.marked_at,
      }))

      setAttendees(formatted)
      setError(null)
    } catch (err: any) {
      console.error('Error fetching attendees:', err)
      setError(err.message ?? 'Failed to load attendees')
      setAttendees([])
    } finally {
      setLoading(false)
    }
  }

  // Toggle attendance for the current user
  const toggleAttendance = async () => {
    if (!currentUserId) {
      alert('You must be signed in to attend events')
      return
    }

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('You must be signed in to attend events')
        return
      }

      // Check if the user is already attending
      const { data: existing } = await supabase
        .from('event_attendance')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', currentUserId)
        .single()

      if (existing) {
        // Remove attendance
        const { error } = await supabase
          .from('event_attendance')
          .delete()
          .eq('id', existing.id)

        if (error) {
          throw error
        }
      } else {
        // Add attendance
        const { error } = await supabase
          .from('event_attendance')
          .insert({
            event_id: eventId,
            user_id: currentUserId,
          })

        if (error) {
          throw error
        }
      }

      // Refresh the list
      await attendEvent(eventId)
    } catch (err: any) {
      console.error('Error toggling attendance:', err)
      alert('Failed to update attendance: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <h2 className="text-2xl font-bold text-primary">Loading attendees...</h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <h2 className="text-2xl font-bold text-primary">Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <a href="/dashboard/events" className="font-medium text-primary hover:underline">
            Go back to events
          </a>
        </div>
      </div>
    )
  }

  const isAttending = !!currentUserId && attendees.some((a) => a.id === currentUserId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-primary">Event Attendees</h1>
        <div className="mt-4 sm:mt-0">
          <Button
            variant="outline"
            onClick={toggleAttendance}
            className="w-full md:w-auto"
          >
            {isAttending ? 'Remove my attendance' : 'Mark as attending'}
          </Button>
        </div>
      </div>

      <Table className="w-full">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Attended at</Th>
          </Tr>
        </Thead>
        <Tbody>
          {attendees.length === 0 ? (
            <Tr>
              <Td colSpan={3} className="text-center py-4">
                No attendees yet
              </Td>
            </Tr>
          ) : (
            attendees.map((attendee, index) => (
              <Tr key={index}>
                <Td>
                  {attendee.first_name} {attendee.last_name}
                </Td>
                <Td>{attendee.email}</Td>
                <Td>
                  {new Date(attendee.marked_at).toLocaleString()}
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </div>
  )
}