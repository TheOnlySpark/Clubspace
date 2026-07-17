"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Club = {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  category_id: string | null
  club_categories?: { name: string } | null
}

type Category = {
  id: string
  name: string
}

export function ClubDirectory() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/admin/club-categories')
        if (res.ok) {
          const data = await res.json()
          setCategories(data)
        }
      } catch (err) {
        console.error('Failed to load categories', err)
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    async function fetchClubs() {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (search) params.append('search', search)
        if (selectedCategory) params.append('category_id', selectedCategory)
        
        const res = await fetch(`/api/clubs?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setClubs(data.clubs || [])
        }
      } catch (err) {
        console.error('Failed to fetch clubs', err)
      } finally {
        setIsLoading(false)
      }
    }

    // Debounce search slightly
    const timer = setTimeout(() => {
      fetchClubs()
    }, 300)
    
    return () => clearTimeout(timer)
  }, [search, selectedCategory])

  return (
    <div className="w-full max-w-6xl mx-auto p-6 text-navy font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Club Directory</h1>
          <p className="text-gray-600 mt-1">Discover and join clubs at your university.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search clubs..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-blue w-full sm:w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          
          <select 
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-blue bg-white w-full sm:w-auto"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-blue"></div>
        </div>
      ) : clubs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">No clubs found matching your criteria.</p>
          <button 
            onClick={() => { setSearch(''); setSelectedCategory('') }}
            className="mt-4 text-electric-blue hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map(club => (
            <Link href={`/clubs/${club.slug}`} key={club.id} className="block group">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 h-full flex flex-col">
                <div className="h-32 bg-gray-100 relative flex items-center justify-center border-b border-gray-100">
                  {club.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={club.logo_url} alt={`${club.name} logo`} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-4xl font-bold opacity-30">{club.name.substring(0, 2).toUpperCase()}</span>
                  )}
                </div>
                
                <div className="p-5 flex-grow flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold group-hover:text-electric-blue transition-colors">{club.name}</h3>
                  </div>
                  
                  {club.club_categories?.name && (
                    <span className="inline-block bg-blue-50 text-electric-blue text-xs font-medium px-2.5 py-0.5 rounded-full mb-3 self-start">
                      {club.club_categories.name}
                    </span>
                  )}
                  
                  <p className="text-gray-600 text-sm line-clamp-3 flex-grow">
                    {club.description || 'No description provided.'}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
