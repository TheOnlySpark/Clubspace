// src/app/clubs/[slug]/page.tsx
"use client";

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import GoogleCalendarButton from '@/components/events/GoogleCalendarButton'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function PublicClubPage() {
  const { slug } = useParams()
  const [club, setClub] = useState<any | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    fetchClubData()
  }, [slug])

  const fetchClubData = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      // Fetch the club by slug
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('slug', slug)
        .single()

      if (clubError) {
        throw clubError
      }

      if (!clubData) {
        throw new Error('Club not found')
      }

      setClub(clubData)

      // Fetch upcoming events for this club
      const now = new Date().toISOString()
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('club_id', clubData.id)
        .eq('status', 'published')
        .gte('starts_at', now)
        .order('starts_at', { ascending: true })

      if (eventsError) {
        throw eventsError
      }

      setEvents(eventsData || [])
      setError(null)
    } catch (err: any) {
      console.error('Error loading club data:', err)
      setError(err.message ?? 'Failed to load club data')
      setClub(null)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <h2 className="text-2xl font-bold text-primary">Loading club...</h2>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <h2 className="text-2xl font-bold text-primary">Club Not Found</h2>
          <p className="text-muted-foreground">{error}</p>
          <Link href="/" className="font-medium text-primary hover:underline">
            Go to home
          </Link>
        </div>
      </div>
    )
  }

  if (!club) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <h2 className="text-2xl font-bold text-primary">Club Not Found</h2>
          <p className="text-muted-foreground">
            The requested club does not exist or is not available.
          </p>
          <Link href="/" className="font-medium text-primary hover:underline">
            Go to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Club Header with Banner */}
      {club.banner_url && (
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={club.banner_url}
            alt={`${club.name} banner`}
            className="object-cover w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>
      )}

      <div className="py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Club Info */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary">{club.name}</h1>
            <p className="text-lg text-muted-foreground mt-4">
              {club.description || 'No description available'}
            </p>
          </div>

          {/* Club Details */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-primary mb-4">Club Details</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <span className="flex-shrink-0 h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                  👥
                </span>
                <div className="ml-4">
                  <p className="font-medium text-muted-foreground">Privacy</p>
                  <p className="text-lg font-medium">{club.privacy}</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="flex-shrink-0 h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                  🔐
                </span>
                <div className="ml-4">
                  <p className="font-medium text-muted-foreground">Join Policy</p>
                  <p className="text-lg font-medium">{club.join_policy}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          {events.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-primary mb-4">Upcoming Events</h2>
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                        📅
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-primary">{event.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {event.location || 'Location not specified'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(event.starts_at)} • {formatDate(event.ends_at)}
                        </p>
                        <p className="text-muted-foreground mt-2 line-clamp-2">
                          {event.description || 'No description available'}
                        </p>
                        <div className="mt-3">
                          <GoogleCalendarButton event={event} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Call to Action - Link to join (would require auth) */}
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              To join this club, you need to be a member of the associated university.
            </p>
            <Link href="/auth/login" className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
              Login to Join
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}