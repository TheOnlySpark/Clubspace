// src/app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) return null

  const userId = session.user.id

  let { data: profile } = await supabase
    .from('profiles')
    .select('university_id')
    .eq('id', userId)
    .single()

  // Auto-create profile for super_admin if missing
  if (!profile) {
    await adminClient.from('profiles').insert({
      id: userId,
      first_name: session.user.user_metadata?.first_name || 'Super',
      last_name: session.user.user_metadata?.last_name || 'Admin',
    })
  }

  const universityId = profile?.university_id

  // Fetch stats
  let clubsCount = 0
  let upcomingEventsCount = 0
  let membersCount = 0

  if (universityId) {
    const { count: cCount } = await supabase.from('clubs').select('*', { count: 'exact', head: true }).eq('university_id', universityId)
    const { count: mCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('university_id', universityId)
    
    // Get clubs to get events
    const { data: clubs } = await supabase.from('clubs').select('id').eq('university_id', universityId)
    const clubIds = clubs?.map((c) => c.id) || []
    
    if (clubIds.length > 0) {
      const { count: eCount } = await supabase.from('events').select('*', { count: 'exact', head: true }).in('club_id', clubIds).gte('starts_at', new Date().toISOString())
      upcomingEventsCount = eCount || 0
    }
    
    clubsCount = cCount || 0
    membersCount = mCount || 0
  } else {
    // If no university_id, fetch global stats for super_admin using adminClient to bypass RLS
    const { count: cCount } = await adminClient.from('clubs').select('*', { count: 'exact', head: true })
    const { count: mCount } = await adminClient.from('profiles').select('*', { count: 'exact', head: true })
    const { count: eCount } = await adminClient.from('events').select('*', { count: 'exact', head: true }).gte('starts_at', new Date().toISOString())
    
    clubsCount = cCount || 0
    membersCount = mCount || 0
    upcomingEventsCount = eCount || 0
  }

  // Fetch recent announcements for "Recent Activity"
  let recentAnnouncements: any[] = []
  if (universityId) {
    const { data } = await supabase
      .from('announcements')
      .select(`
        id,
        title,
        created_at,
        clubs(name)
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(5)
    recentAnnouncements = data || []
  } else {
    // Global admin gets all recent announcements
    const { data } = await adminClient
      .from('announcements')
      .select(`
        id,
        title,
        created_at,
        clubs(name)
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(5)
    recentAnnouncements = data || []
  }

  const isGlobal = !universityId

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight text-gradient">Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Welcome back, {session.user.user_metadata?.first_name || 'User'}! 
          {isGlobal ? " Here is the global platform overview." : " Here is what's happening at your university."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Card 1 */}
        <div className="glass-card rounded-2xl p-6 hover-lift relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-colors" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2 relative z-10">Total Clubs</h3>
          <p className="text-4xl font-bold text-foreground relative z-10">{clubsCount}</p>
          <div className="mt-4 flex items-center text-sm text-emerald-400 relative z-10">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>Active across platform</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-card rounded-2xl p-6 hover-lift relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-accent/20 rounded-full blur-2xl group-hover:bg-accent/30 transition-colors" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2 relative z-10">Upcoming Events</h3>
          <p className="text-4xl font-bold text-foreground relative z-10">{upcomingEventsCount}</p>
          <div className="mt-4 flex items-center text-sm text-emerald-400 relative z-10">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>Starting soon</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-card rounded-2xl p-6 hover-lift relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-colors" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2 relative z-10">Total Members</h3>
          <p className="text-4xl font-bold text-foreground relative z-10">{membersCount}</p>
          <div className="mt-4 flex items-center text-sm text-emerald-400 relative z-10">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>Registered users</span>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-8 hover-lift">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-foreground">Recent Activity</h3>
          <button className="text-sm text-primary hover:text-primary/80 transition-colors">View all</button>
        </div>
        
        {recentAnnouncements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-foreground mb-1">It&apos;s quiet in here...</p>
            <p className="text-muted-foreground">No recent activity yet. Start by creating a club or joining one!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentAnnouncements.map((announcement) => (
              <div key={announcement.id} className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors">
                <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center shrink-0">
                  <span className="text-xl">📢</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-100 truncate">
                    {announcement.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {announcement.clubs?.name || 'University-wide'}
                  </p>
                </div>
                <div className="text-xs text-slate-500 whitespace-nowrap">
                  {new Date(announcement.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}