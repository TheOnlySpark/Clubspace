"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ClubHardDeleteModalProps {
  clubId: string
  clubName: string
  isOpen: boolean
  onClose: () => void
}

export function ClubHardDeleteModal({ clubId, clubName, isOpen, onClose }: ClubHardDeleteModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleDelete = async () => {
    if (confirmName !== clubName) {
      setError('Club name does not match')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/clubs/${clubId}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to permanently delete club')
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
        <h3 className="text-xl font-bold mb-2 text-red-600">Permanently Delete Club</h3>
        
        <p className="text-gray-600 mb-4 text-sm">
          This action <strong>cannot</strong> be undone. This will permanently delete the <strong>{clubName}</strong> club and all of its associated data, including events, announcements, and memberships.
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Please type <strong>{clubName}</strong> to confirm.
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={clubName}
          />
        </div>

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
            onClick={handleDelete}
            disabled={isSubmitting || confirmName !== clubName}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  )
}
