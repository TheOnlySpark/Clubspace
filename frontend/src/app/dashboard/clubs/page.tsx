// src/app/dashboard/clubs/page.tsx
"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'
import CreateClubModal from '@/components/clubs/CreateClubModal'
import styles from './clubs.module.css'

export default function ClubsPage() {
  const { user } = useAuth()
  const { isAdmin } = useRole()
  const [clubs, setClubs] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [universityId, setUniversityId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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
      
    // Count members using JS
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

  useEffect(() => {
    fetchClubs()
  }, [user])

  const filteredClubs = clubs.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  const handleClubCreated = (newClub: any) => {
    // Re-fetch to get accurate data, or just optimistically add to the list
    fetchClubs()
  }

  if (loading) {
    return (
      <div className={styles.pageContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#3b82f6', fontWeight: 500 }}>Loading clubs...</p>
      </div>
    )
  }

  if (!universityId) {
    return (
      <div className={styles.pageContainer} style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.75rem', padding: '2rem', textAlign: 'center', maxWidth: '32rem', width: '100%' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>No University Found</h2>
          <p style={{ color: '#94a3b8' }}>You must be associated with a university to view clubs.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>University Clubs</h1>
          <p className={styles.subtitle}>Discover and join student organizations</p>
        </div>
        
        <div className={styles.controls}>
          <div className={styles.searchWrapper}>
            <svg className={styles.searchIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search clubs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
          {isAdmin() && (
            <button onClick={() => setIsModalOpen(true)} className={styles.createButton}>
              <svg className={styles.buttonIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create
            </button>
          )}
        </div>
      </div>

      {/* Clubs Grid */}
      {filteredClubs.length === 0 ? (
        <div className={styles.emptyState}>
          <svg className={styles.emptyIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className={styles.emptyTitle}>No clubs found</h3>
          <p className={styles.emptySubtitle}>Try adjusting your search{isAdmin() ? ' or create a new club' : ''}.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredClubs.map((club) => (
            <div key={club.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle} title={club.name}>{club.name}</h3>
                {club.isMember ? (
                  <span className={`${styles.badge} ${styles.badgeMember}`}>
                    Member
                  </span>
                ) : (
                  <span className={`${styles.badge} ${styles.badgePrivacy}`}>
                    {club.privacy}
                  </span>
                )}
              </div>
              
              <p className={styles.cardDescription}>
                {club.description || "No description provided for this club."}
              </p>
              
              <div className={styles.cardFooter}>
                <div className={styles.memberCount}>
                  <svg className={styles.memberIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {club.memberCount} members
                </div>
                
                {!club.isMember && (
                  <button className={styles.joinButton}>
                    Join Club
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Club Modal */}
      <CreateClubModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleClubCreated}
      />
    </div>
  )
}
