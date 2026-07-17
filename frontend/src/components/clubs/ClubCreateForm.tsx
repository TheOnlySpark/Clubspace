"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Category = {
  id: string
  name: string
}

export function ClubCreateForm() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    contact_email: '',
    initial_admin_id: '', // Requires a valid User UUID
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
    setError('')

    try {
      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          category_id: formData.category_id || null, // null if empty
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create club')
      }

      // Redirect to the new club's settings or profile
      router.push(`/clubs/${data.slug}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100 font-sans text-navy">
      <h2 className="text-2xl font-bold mb-6">Create New Club</h2>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Club Name <span className="text-red-500">*</span></label>
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
            placeholder="e.g., Computer Science Society"
          />
        </div>

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
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            id="description"
            name="description"
            rows={4}
            maxLength={2000}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-blue transition-shadow resize-none"
            value={formData.description}
            onChange={handleChange}
            placeholder="What is this club about?"
          />
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
            placeholder="club@university.edu"
          />
        </div>

        <div>
          <label htmlFor="initial_admin_id" className="block text-sm font-medium text-gray-700 mb-1">Initial Club Admin (User ID) <span className="text-red-500">*</span></label>
          <input
            type="text"
            id="initial_admin_id"
            name="initial_admin_id"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-electric-blue transition-shadow font-mono text-sm"
            value={formData.initial_admin_id}
            onChange={handleChange}
            placeholder="e.g., 550e8400-e29b-41d4-a716-446655440000"
          />
          <p className="text-xs text-gray-500 mt-1">Provide the UUID of the user who will be the initial admin for this club.</p>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 bg-electric-blue text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </>
          ) : 'Create Club'}
        </button>
      </div>
    </form>
  )
}
