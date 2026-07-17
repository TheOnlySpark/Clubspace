"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Club = {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  category_id: string | null
  contact_email: string | null
  social_links: Record<string, string> | null
}

type Category = {
  id: string
  name: string
}

interface ClubSettingsPanelProps {
  club: Club
  isAdmin: boolean
}

export function ClubSettingsPanel({ club, isAdmin }: ClubSettingsPanelProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [formData, setFormData] = useState({
    name: club.name,
    description: club.description || '',
    category_id: club.category_id || '',
    contact_email: club.contact_email || '',
    logo_url: club.logo_url || '',
    banner_url: club.banner_url || '',
    // Just a simple social links handling for instagram and twitter
    social_twitter: club.social_links?.twitter || '',
    social_instagram: club.social_links?.instagram || '',
  })

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      const social_links: Record<string, string> = {}
      if (formData.social_twitter) social_links.twitter = formData.social_twitter
      if (formData.social_instagram) social_links.instagram = formData.social_instagram

      const payload = {
        name: formData.name,
        description: formData.description,
        category_id: formData.category_id || null,
        contact_email: formData.contact_email,
        logo_url: formData.logo_url,
        banner_url: formData.banner_url,
        social_links
      }

      const res = await fetch(`/api/clubs/${club.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update club settings')
      }

      setMessage({ type: 'success', text: 'Club settings updated successfully!' })
      router.refresh()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 font-sans text-navy">
      <h2 className="text-2xl font-bold mb-6">Club Settings</h2>
      
      {message.text && (
        <div className={`mb-6 p-4 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 border-l-4 border-green-500 text-green-700' : 'bg-red-50 border-l-4 border-red-500 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Club Name</label>
            <input
              type="text"
              id="name"
              name="name"
              required
              minLength={2}
              maxLength={100}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-blue transition-shadow"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
            <input
              type="text"
              id="slug"
              value={club.slug}
              readOnly
              disabled
              className="w-full px-4 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg cursor-not-allowed"
              title={isAdmin ? "Only University Admins can change the slug" : ""}
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={2000}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-blue transition-shadow resize-none"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              id="category_id"
              name="category_id"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-blue bg-white"
              value={formData.category_id}
              onChange={handleChange}
            >
              <option value="">Select a category...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
            <input
              type="email"
              id="contact_email"
              name="contact_email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-blue transition-shadow"
              value={formData.contact_email}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
          <div>
            <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
            <input
              type="url"
              id="logo_url"
              name="logo_url"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-blue transition-shadow"
              value={formData.logo_url}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>

          <div>
            <label htmlFor="banner_url" className="block text-sm font-medium text-gray-700 mb-1">Banner URL</label>
            <input
              type="url"
              id="banner_url"
              name="banner_url"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-blue transition-shadow"
              value={formData.banner_url}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
          <div>
            <label htmlFor="social_twitter" className="block text-sm font-medium text-gray-700 mb-1">Twitter/X URL</label>
            <input
              type="url"
              id="social_twitter"
              name="social_twitter"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-blue transition-shadow"
              value={formData.social_twitter}
              onChange={handleChange}
              placeholder="https://twitter.com/..."
            />
          </div>

          <div>
            <label htmlFor="social_instagram" className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
            <input
              type="url"
              id="social_instagram"
              name="social_instagram"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-blue transition-shadow"
              value={formData.social_instagram}
              onChange={handleChange}
              placeholder="https://instagram.com/..."
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-electric-blue text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
