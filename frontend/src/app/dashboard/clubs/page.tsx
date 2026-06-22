// src/app/dashboard/clubs/page.tsx
"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import { Users, Search, Plus } from 'lucide-react'

export default function ClubsPage() {
  const { user } = useAuth()
  const [clubs, setClubs] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [universityId, setUniversityId] = useState<string | null>(null)

  useEffect(() => {
    const fetchClubs = async () => {
      if (!user) return
      const supabase = createClient()

      // Get user's university
      const { data: profile } = await supabase
        .from('profiles')
        .select('university_id')
        .eq('id', user.id)
        .single()

      if (!profile?.university_id) {
        setLoading(false)
        return
      }

      setUniversityId(profile.university_id)

      // Fetch all public/university clubs for this university
      const { data: clubsData } = await supabase
        .from('clubs')
        .select(`
          id,
          name,
          description,
          privacy,
          club_memberships!inner(user_id)
        `)
        .eq('university_id', profile.university_id)
        
      // Count members using JS to avoid PostgREST complexity
      const transformedClubs = (clubsData || []).map((club: any) => ({
        id: club.id,
        name: club.name,
        description: club.description,
        privacy: club.privacy,
        memberCount: club.club_memberships?.length || 0,
        isMember: club.club_memberships?.some((m: any) => m.user_id === user.id) || false
      }))

      setClubs(transformedClubs)
      setLoading(false)
    }

    fetchClubs()
  }, [user])

  const filteredClubs = clubs.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-blue-500 font-medium">Loading clubs...</p>
      </div>
    )
  }

  if (!universityId) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-8 text-center max-w-lg mx-auto mt-10">
        <h2 className="text-xl font-bold text-blue-900 mb-2">No University Found</h2>
        <p className="text-gray-600">You must be associated with a university to view clubs.</p>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-[calc(100vh-8rem)] rounded-xl shadow-sm border border-blue-100 p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">University Clubs</h1>
          <p className="text-gray-600 mt-1">Discover and join student organizations</p>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search clubs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-800 bg-blue-50/50"
            />
          </div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus className="h-4 w-4" />
            Create
          </button>
        </div>
      </div>

      {/* Clubs Grid */}
      {filteredClubs.length === 0 ? (
        <div className="text-center py-16 bg-blue-50/50 rounded-xl border border-blue-100 border-dashed">
          <Users className="h-12 w-12 text-blue-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-blue-900">No clubs found</h3>
          <p className="text-gray-500">Try adjusting your search or create a new club.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map((club) => (
            <div 
              key={club.id} 
              className="border border-blue-100 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all bg-white flex flex-col"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-blue-950 truncate pr-2">{club.name}</h3>
                {club.isMember ? (
                  <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full shrink-0">
                    Member
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full shrink-0">
                    {club.privacy}
                  </span>
                )}
              </div>
              
              <p className="text-gray-600 text-sm mb-6 flex-1 line-clamp-3">
                {club.description || "No description provided for this club."}
              </p>
              
              <div className="flex items-center justify-between pt-4 border-t border-blue-50 mt-auto">
                <div className="flex items-center text-gray-500 text-sm font-medium">
                  <Users className="h-4 w-4 mr-1.5" />
                  {club.memberCount} members
                </div>
                
                {!club.isMember && (
                  <button className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                    Join Club
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
