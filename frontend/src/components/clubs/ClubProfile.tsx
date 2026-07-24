"use client"
import Link from 'next/link'
import { useState } from 'react'
import { Globe, Mail, Users, ChevronLeft } from 'lucide-react' // Assuming lucide-react is installed
export type ClubProfileData = {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  contact_email: string | null
  social_links: Record<string, string> | null
  club_categories?: { name: string } | null
}

interface ClubProfileProps {
  club: ClubProfileData
  memberCount: number
  isAdmin?: boolean // if true, show edit button
}

export function ClubProfile({ club, memberCount, isAdmin = false }: ClubProfileProps) {
  // Try to parse social links if they exist
  const socials = club.social_links || {}

  return (
    <div className="w-full max-w-5xl mx-auto pb-12 font-sans text-navy">
      {/* Back button */}
      <div className="px-6 py-4">
        <Link href="/clubs" className="inline-flex items-center text-gray-500 hover:text-electric-blue transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Directory
        </Link>
      </div>

      {/* Banner */}
      <div className="w-full h-48 md:h-72 bg-navy relative rounded-t-2xl overflow-hidden">
        {club.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={club.banner_url} alt="Club Banner" className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-navy to-electric-blue opacity-90"></div>
        )}
      </div>

      <div className="px-6 md:px-10 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-end gap-6">
            {/* Logo */}
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl border-4 border-white bg-white shadow-md overflow-hidden shrink-0 flex items-center justify-center">
              {club.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={club.logo_url} alt={`${club.name} logo`} className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-5xl font-bold opacity-30">{club.name.substring(0, 2).toUpperCase()}</span>
              )}
            </div>
            
            <div className="pb-2 md:pb-4">
              <h1 className="text-3xl md:text-4xl font-bold text-navy">{club.name}</h1>
              {club.club_categories?.name && (
                <span className="inline-block bg-blue-50 text-electric-blue text-sm font-medium px-3 py-1 rounded-full mt-2">
                  {club.club_categories.name}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex gap-3 pb-2 md:pb-4">
            <button className="bg-electric-blue hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors">
              Join Club
            </button>
            {isAdmin && (
              <Link href={`/dashboard/clubs/${club.id}/settings`} className="bg-gray-100 hover:bg-gray-200 text-navy font-medium py-2.5 px-6 rounded-lg transition-colors border border-gray-200">
                Manage
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
          <div className="md:col-span-2 space-y-8">
            <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold mb-4 text-navy border-b border-gray-100 pb-2">About Us</h2>
              <div className="prose max-w-none text-gray-600 whitespace-pre-wrap">
                {club.description || 'This club hasn\'t added a description yet.'}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-lg mb-4 text-navy">Club Info</h3>
              <ul className="space-y-4">
                <li className="flex items-start text-gray-600 group">
                  <Users className="w-5 h-5 mr-3 text-electric-blue shrink-0 group-hover:text-blue-700 transition-colors" />
                  <div>
                    <p className="font-medium text-navy group-hover:text-blue-700 transition-colors">{memberCount} Members</p>
                  </div>
                </li>
                {club.contact_email && (
                  <li className="flex items-center text-gray-600">
                    <Mail className="w-5 h-5 mr-3 text-electric-blue shrink-0" />
                    <a href={`mailto:${club.contact_email}`} className="hover:text-electric-blue hover:underline break-all">
                      {club.contact_email}
                    </a>
                  </li>
                )}
                {Object.entries(socials).map(([platform, url]) => (
                  <li key={platform} className="flex items-center text-gray-600 capitalize">
                    <Globe className="w-5 h-5 mr-3 text-electric-blue shrink-0" />
                    <a href={url as string} target="_blank" rel="noopener noreferrer" className="hover:text-electric-blue hover:underline truncate">
                      {platform}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
