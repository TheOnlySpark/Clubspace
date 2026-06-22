// src/app/dashboard/events/page.tsx
"use client";

import { useState } from 'react'
import { useAuth, useRole } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/server'
import EventCard from '@/components/events/EventCard'
import EventForm from '@/components/events/EventForm'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/lib/utils'

export default function EventsPage() {
  const { user } = useAuth()
  const { role: userRole, isClubAdmin, isUniversityAdmin, isSuperAdmin } = useRole()
  const [events, setEvents] = useState<Array<any>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any | null>(null)

  // Fetch events for the user's university
  async function loadEvents() {
    if (!user) return

    setLoading(true)
    try {
      const supabase = createClient()

      // Get the user's profile to get university_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('university_id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        throw new Error('Profile not found')
      }

      const universityId = profile.university_id

      // Get all clubs in this university
      const { data: clubs, error: clubsError } = await supabase
        .from('clubs')
        .select('id')
        .eq('university_id', universityId)

      if (clubsError) {
        throw clubsError
      }

      const clubIds = clubs?.map((club) => club.id) || []

      // Get events for these clubs
      let eventsData: any[] = []
      if (clubIds.length > 0) {
        const { data, error } = await supabase
          .from('events')
          .select('*, clubs!inner(name)')
          .in('club_id', clubIds)
          .order('starts_at', { ascending: false })

        if (error) {
          throw error
        }

        eventsData = data.map((event: any) => ({
          ...event,
          club_name: event.clubs?.name,
        }))
      }

      setEvents(eventsData)
      setError(null)
    } catch (err: any) {
      console.error('Error loading events:', err)
      setError(err.message ?? 'Failed to load events')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  // Handle event creation/update
  async function handleEventSubmit(eventData: any) {
    try {
      const supabase = createClient()

      // Get the user's profile to get university_id (for validation)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('university_id, id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        throw new Error('Profile not found')
      }

      const universityId = profile.university_id
      const userId = profile.id

      // Determine which club to assign the event to
      // For simplicity, we'll let the user select a club in the form.
      // But we don't have a club selector in the form yet.
      // We'll need to add a club selection to the EventForm.
      // For now, we'll assume the event belongs to a club that the user is a member of.
      // We'll get the first club the user is a member of in the university.
      // This is a simplification; in a real app, we'd have a club selector.

      // Get the user's clubs in the university
      const { data: userClubs, error: userClubsError } = await supabase
        .from('club_memberships')
        .select('club_id, clubs!inner(university_id)')
        .eq('user_id', userId)
        .eq('clubs.university_id', universityId)

      if (userClubsError) {
        throw userClubsError
      }

      if (userClubs.length === 0) {
        throw new Error('You are not a member of any club in this university')
      }

      // Use the first club as the default
      const clubId = userClubs[0].club_id

      // Prepare event data for insertion/update
      const eventToSave = {
        ...eventData,
        club_id: clubId,
        created_by: userId,
      }

      if (editingEvent) {
        // Update existing event
        const { error } = await supabase
          .from('events')
          .update(eventToSave)
          .eq('id', editingEvent.id)

        if (error) {
          throw error
        }
      } else {
        // Create new event
        const { error } = await supabase
          .from('events')
          .insert(eventToSave)

        if (error) {
          throw error
        }
      }

      // Reload events
      await loadEvents()
      setShowForm(false)
      setEditingEvent(null)
    } catch (err: any) {
      console.error('Error saving event:', err)
      setError(err.message ?? 'Failed to save event')
    }
  }

  // Handle delete event
  async function handleDeleteEvent(eventId: string) {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (error) {
        throw error
      }

      await loadEvents()
    } catch (err: any) {
      console.error('Error deleting event:', err)
      setError(err.message ?? 'Failed to delete event')
    }
  }

  // Load events on mount
  React.useEffect(() => {
    loadEvents()
  }, [user])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <h2 className="text-2xl font-bold text-primary">Loading events...</h2>
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
          <a href="/dashboard" className="font-medium text-primary hover:underline">
            Go back to dashboard
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-primary">Events</h1>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button
            variant="outline"
            onClick={() => setShowForm(true)}
            disabled={!(isClubAdmin || isUniversityAdmin || isSuperAdmin)}
            className="w-full md:w-auto"
          >
            New Event
          </Button>
        </div>
      </div>

      {events.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div key={event.id}>
              <EventCard
                event={{
                  id: event.id,
                  title: event.title,
                  description: event.description,
                  location: event.location,
                  starts_at: event.starts_at,
                  ends_at: event.ends_at,
                  capacity: event.capacity,
                  status: event.status,
                }}
                showActions={isClubAdmin || isUniversityAdmin || isSuperAdmin}
              />
              {/* Action buttons for admin/officer */}
              {isClubAdmin || isUniversityAdmin || isSuperAdmin && (
                <div className="mt-2 flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingEvent(event)
                      setShowForm(true)
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteEvent(event.id)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No events found.</p>
      )}

      {/* Event form (create/edit) */}
      {showForm && (
        <div className="mt-6 border-t pt-6">
          <h2 className="text-xl font-semibold text-primary mb-4">
            {editingEvent ? 'Edit Event' : 'New Event'}
          </h2>
          <EventForm
            onSubmit={handleEventSubmit}
            initialData={editingEvent
              ? {
                  title: editingEvent.title,
                  description: editingEvent.description,
                  location: editingEvent.location,
                  starts_at: editingEvent.starts_at,
                  ends_at: editingEvent.ends_at,
                  capacity: editingEvent.capacity,
                  status: editingEvent.status,
                }
              : undefined}
            isEditing={!!editingEvent}
          />
        </div>
      )}
    </div>
  )
}