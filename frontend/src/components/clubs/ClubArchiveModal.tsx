"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ClubArchiveModalProps {
  clubId: string
  clubName: string
  isOpen: boolean
  onClose: () => void
}

export function ClubArchiveModal({ clubId, clubName, isOpen, onClose }: ClubArchiveModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleArchive = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/clubs/${clubId}/archive`, {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to archive club')
      }

      router.push('/clubs') // Redirect back to directory
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-sans text-navy">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-xl font-bold mb-2">Archive Club</h3>
        
        <p className="text-gray-600 mb-6">
          Are you sure you want to archive <strong>{clubName}</strong>? 
          This will hide the club from the public directory and prevent new memberships or events. 
          Historical data will be preserved, and the club can be restored later.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleArchive}
            disabled={isSubmitting}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Archiving...' : 'Archive Club'}
          </button>
        </div>
      </div>
    </div>
  )
}
