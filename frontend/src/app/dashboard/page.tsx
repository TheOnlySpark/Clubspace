// src/app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    // This should not happen because of the layout guard, but just in case
    return null
  }

  const userId = session.user.id

  // Fetch user's profile to get university_id
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('university_id')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    console.error('Error fetching profile:', profileError)
    // For now, we'll show empty stats
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    )
  }

  const universityId = profile.university_id

  // Fetch clubs count for the user's university
  const { data: clubsData, error: clubsError, count: clubsCountRaw } = await supabase
    .from('clubs')
    .select('id', { count: 'exact' })
    .eq('university_id', universityId)

  // Fetch upcoming events count for the user's university (events that start after now)
  const now = new Date().toISOString()
  const { data: eventsData, error: eventsError } = await supabase
    .from('events')
    .select('id', { count: 'exact' })
    .eq('club_id.university_id', universityId) // This won't work because we need to join
    .gte('starts_at', now)

  // Instead, we'll do two separate queries: first get clubs in the university, then get events for those clubs.
  // But for simplicity, we'll do a more complex query or do it in two steps.

  // Let's get the clubs in the university first, then use their IDs to get events.
  // We'll do it in two steps for clarity.

  // Fetch clubs in the university
  const { data: clubs, error: clubsListError } = await supabase
    .from('clubs')
    .select('id')
    .eq('university_id', universityId)

  const clubIds = clubs?.map((club) => club.id) || []

  // Fetch upcoming events for these clubs
  let upcomingEventsCount = 0
  if (clubIds.length > 0) {
    const { data: events, error: eventsListError, count: eventsCountRaw } = await supabase
      .from('events')
      .select('id', { count: 'exact' })
      .in('club_id', clubIds)
      .gte('starts_at', now)

    if (!eventsListError) {
      upcomingEventsCount = eventsCountRaw || 0
    }
  }

  // Fetch members count for the user's university (profiles with the university_id)
  const { data: membersData, error: membersError, count: membersCountRaw } = await supabase
    .from('profiles')
    .select('id', { count: 'exact' })
    .eq('university_id', universityId)

  // Fetch clubs count
  const clubsCount = clubsCountRaw || 0
  const membersCount = membersCountRaw || 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome back, {session.user.user_metadata?.first_name || 'User'}!
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-primary mb-2">Clubs</h3>
          <p className="text-2xl font-bold">{clubsCount}</p>
          <p className="text-sm text-muted-foreground">Total clubs in your university</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-primary mb-2">Upcoming Events</h3>
          <p className="text-2xl font-bold">{upcomingEventsCount}</p>
          <p className="text-sm text-muted-foreground">Events starting from today</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-primary mb-2">Members</h3>
          <p className="text-2xl font-bold">{membersCount}</p>
          <p className="text-sm text-muted-foreground">Total members in your university</p>
        </div>
      </div>
      {/* Recent activity placeholder */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">Recent Activity</h3>
        <p className="text-sm text-muted-foreground">
          No recent activity yet. Start by creating a club or joining one!
        </p>
      </div>
    </div>
  )
}