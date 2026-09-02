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

  let membersCount = 0

  if (universityId) {
    const [clubsResult, membersResult] = await Promise.all([
      supabase.from('clubs').select('*', { count: 'exact', head: true }).eq('university_id', universityId),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('university_id', universityId),
    ])

    clubsCount = clubsResult.count || 0
    membersCount = membersResult.count || 0
  } else {
    // If no university_id, fetch global stats for super_admin using adminClient to bypass RLS
    const [clubsResult, membersResult] = await Promise.all([
      adminClient.from('clubs').select('*', { count: 'exact', head: true }),
      adminClient.from('profiles').select('*', { count: 'exact', head: true }),
    ])
    clubsCount = clubsResult.count || 0
    membersCount = membersResult.count || 0
  }

  // Fetch recent announcements for "Recent Activity"
  let recentAnnouncements: any[] = []
  if (universityId) {
    const { data } = await supabase
      .from('announcements')
      .select(`
        id,
        title,
        pinned,
        created_at,
        clubs(name)
      `)
      .eq('status', 'published')
      .order('pinned', { ascending: false })
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
        pinned,
        created_at,
        clubs(name)
      `)
      .eq('status', 'published')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5)
    recentAnnouncements = data || []
  }

  const isGlobal = !universityId

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-lg">
          Welcome back, {session.user.user_metadata?.first_name || 'User'}!
          {isGlobal ? " Here is the global platform overview." : " Here is what's happening at your university."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Card 1 */}
        <div className="solid-card p-6 hover-lift relative overflow-hidden group">
          <h3 className="text-sm font-semibold text-slate-500 mb-2 relative z-10 uppercase tracking-wide">Total Clubs</h3>
          <p className="text-4xl font-extrabold text-slate-900 relative z-10">{clubsCount}</p>
          <div className="mt-4 flex items-center text-sm text-emerald-600 font-medium relative z-10">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>Active across platform</span>
          </div>
        </div>



        {/* Card 3 */}
        <div className="solid-card p-6 hover-lift relative overflow-hidden group">
          <h3 className="text-sm font-semibold text-slate-500 mb-2 relative z-10 uppercase tracking-wide">Total Members</h3>
          <p className="text-4xl font-extrabold text-slate-900 relative z-10">{membersCount}</p>
          <div className="mt-4 flex items-center text-sm text-emerald-600 font-medium relative z-10">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>Registered users</span>
          </div>
        </div>
      </div>

      <div className="solid-card p-8 hover-lift">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>
          <button className="text-sm font-semibold text-indigo-700 hover:text-indigo-800 transition-colors">View all</button>
        </div>

        {recentAnnouncements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-lg font-bold text-slate-900 mb-1">It&apos;s quiet in here...</p>
            <p className="text-slate-500 font-medium">No recent activity yet. Start by creating a club or joining one!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-colors ${
                  announcement.pinned
                    ? 'bg-amber-50 border-amber-200 hover:border-amber-300'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  announcement.pinned ? 'bg-amber-100' : 'bg-slate-200'
                }`}>
                  <div className="flex items-center justify-center">
                    {announcement.pinned ? (
                      <img src="/icons/pin.svg" alt="Pinned" className="w-5 h-5 opacity-70 filter brightness-0" />
                    ) : (
                      <img src="/icons/announcement.svg" alt="Announcement" className="w-5 h-5 opacity-70 filter brightness-0" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {announcement.title}
                    </p>
                    {announcement.pinned && (
                      <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wide shrink-0">
                        Pinned
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    {announcement.clubs?.name || 'University-wide'}
                  </p>
                </div>
                <div className="text-xs font-semibold text-slate-400 whitespace-nowrap">
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