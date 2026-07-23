// src/components/announcements/AnnouncementForm.tsx
"use client"
import * as React from 'react'
import { useState, useEffect } from 'react'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { announcementCreateSchema } from '@/lib/validations/announcements'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'

interface AnnouncementFormProps {
  onSubmit: (data: z.infer<typeof announcementCreateSchema>) => Promise<void>
  initialData?: Partial<z.infer<typeof announcementCreateSchema>>
  isEditing?: boolean
  onCancel?: () => void
}

export default function AnnouncementForm({
  onSubmit,
  initialData,
  isEditing = false,
  onCancel,
}: AnnouncementFormProps) {
  const { user } = useAuth()
  const { role, isUniversityAdmin, isSuperAdmin } = useRole()
  const [clubs, setClubs] = useState<Array<{ id: string; name: string }>>([])
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    body: initialData?.body || '',
    club_id: initialData?.club_id || '',
    visibility: initialData?.visibility || 'club' as const,
    status: initialData?.status || 'draft' as const,
    publish_at: initialData?.publish_at || '',
    expires_at: initialData?.expires_at || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Fetch user's clubs
  useEffect(() => {
    if (!user) return
    const fetchClubs = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('club_memberships')
        .select('club_id, role, clubs!inner(id, name)')
        .eq('user_id', user.id)
        .in('role', ['admin', 'officer'])

      if (data) {
        const mapped = data.map((m: any) => ({ id: (m.clubs as any).id, name: (m.clubs as any).name }))
        setClubs(mapped)
        if (!formData.club_id && mapped.length > 0) {
          setFormData(prev => ({ ...prev, club_id: mapped[0].id }))
        }
      }
    }
    fetchClubs()
  }, [user])

  const canSelectUniversity = isUniversityAdmin() || isSuperAdmin()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setIsLoading(true)

    try {
      const dataToSubmit = {
        ...formData,
        club_id: formData.visibility === 'university' ? null : formData.club_id,
        publish_at: formData.publish_at || null,
        expires_at: formData.expires_at || null,
      }
      const parsed = announcementCreateSchema.parse(dataToSubmit)
      await onSubmit(parsed)
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        err.issues.forEach(issue => {
          const field = issue.path[0] as string
          fieldErrors[field] = issue.message
        })
        setErrors(fieldErrors)
      } else {
        setErrors({ _form: err.message || 'An error occurred' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors._form && (
        <div className="rounded-lg bg-red-900/30 border border-red-700 px-4 py-3 text-sm text-red-300">
          {errors._form}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="mb-2 block text-sm font-medium text-slate-300">
          Title <span className="text-slate-500">({formData.title.length}/150)</span>
        </label>
        <Input
          id="title"
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          placeholder="Announcement title"
          maxLength={150}
          required
          className={cn('w-full', errors.title ? 'border-red-500' : '')}
        />
        {errors.title && <p className="mt-1 text-sm text-red-400">{errors.title}</p>}
      </div>

      {/* Body */}
      <div>
        <label htmlFor="body" className="mb-2 block text-sm font-medium text-slate-300">
          Body <span className="text-slate-500">({formData.body.length}/5000)</span>
        </label>
        <textarea
          id="body"
          name="body"
          value={formData.body}
          onChange={handleChange}
          placeholder="Write your announcement..."
          maxLength={5000}
          rows={8}
          className={cn(
            'block w-full rounded-lg border bg-slate-900 border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors',
            errors.body ? 'border-red-500' : ''
          )}
        />
        {errors.body && <p className="mt-1 text-sm text-red-400">{errors.body}</p>}
      </div>

      {/* Club & Visibility Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Visibility */}
        <div>
          <label htmlFor="visibility" className="mb-2 block text-sm font-medium text-slate-300">
            Visibility
          </label>
          <select
            id="visibility"
            name="visibility"
            value={formData.visibility}
            onChange={handleChange}
            className="block w-full rounded-lg border bg-slate-900 border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="club">Club only</option>
            {canSelectUniversity && <option value="university">University-wide</option>}
          </select>
        </div>

        {/* Club Selector (hidden if university-wide) */}
        {formData.visibility === 'club' && (
          <div>
            <label htmlFor="club_id" className="mb-2 block text-sm font-medium text-slate-300">
              Club
            </label>
            <select
              id="club_id"
              name="club_id"
              value={formData.club_id}
              onChange={handleChange}
              className="block w-full rounded-lg border bg-slate-900 border-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {clubs.map(club => (
                <option key={club.id} value={club.id}>{club.name}</option>
              ))}
            </select>
            {errors.club_id && <p className="mt-1 text-sm text-red-400">{errors.club_id}</p>}
          </div>
        )}
      </div>

      {/* Scheduling Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="publish_at" className="mb-2 block text-sm font-medium text-slate-300">
            Schedule publish <span className="text-slate-500">(optional)</span>
          </label>
          <Input
            id="publish_at"
            name="publish_at"
            type="datetime-local"
            value={formData.publish_at}
            onChange={handleChange}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="expires_at" className="mb-2 block text-sm font-medium text-slate-300">
            Expires at <span className="text-slate-500">(optional)</span>
          </label>
          <Input
            id="expires_at"
            name="expires_at"
            type="datetime-local"
            value={formData.expires_at}
            onChange={handleChange}
            className="w-full"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isLoading} className="flex-1 sm:flex-none">
          {isLoading
            ? 'Saving...'
            : isEditing
              ? 'Update'
              : formData.status === 'published'
                ? 'Publish'
                : 'Save Draft'}
        </Button>
        {!isEditing && role === 'officer' && (
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => {
              setFormData(prev => ({ ...prev, status: 'pending_approval' }))
              // trigger submit
              const form = document.querySelector('form')
              form?.requestSubmit()
            }}
          >
            Submit for Approval
          </Button>
        )}
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}