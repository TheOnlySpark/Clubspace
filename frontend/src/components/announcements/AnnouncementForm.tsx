// src/components/announcements/AnnouncementForm.tsx
"use client"
import * as React from 'react'
import { useState } from 'react'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { announcementSchema } from '@/lib/validations/announcements'
import { createClient } from '@/lib/supabase/client'

interface AnnouncementFormProps {
  onSubmit: (announcementData: z.infer<typeof announcementSchema>) => Promise<void>
  initialData?: Partial<z.infer<typeof announcementSchema>>
  isEditing?: boolean
}

export default function AnnouncementForm({
  onSubmit,
  initialData,
  isEditing = false,
}: AnnouncementFormProps) {
  const [formData, setFormData] = useState<z.infer<typeof announcementSchema>>({
    title: '',
    body: '',
    ...(initialData || {}),
  })
  const [errors, setErrors] = useState<Partial<Record<keyof z.infer<typeof announcementSchema>, string>>>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field when user types
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setIsLoading(true)

    try {
      const parsed = announcementSchema.parse(formData)
      await onSubmit(parsed)
      // Optionally reset form on success
      // setFormData({ ...initialData, ...defaultValues })
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof z.infer<typeof announcementSchema>, string>> = {}
        err.errors.forEach(error => {
          const field = error.path[0] as keyof z.infer<typeof announcementSchema>
          fieldErrors[field] = error.message
        })
        setErrors(fieldErrors)
      } else {
        console.error('Unexpected error:', err)
        // TODO: show a toast or general error
        alert('An unexpected error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="mb-2 block text-sm font-medium text-muted-foreground">
          Announcement title
        </label>
        <Input
          id="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter announcement title"
          required
          className={cn('w-full', errors.title ? 'border-destructive' : '')}
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
      </div>
      <div>
        <label htmlFor="body" className="mb-2 block text-sm font-medium text-muted-foreground">
          Announcement body
        </label>
        <textarea
          id="body"
          value={formData.body}
          onChange={e => {
            setFormData(prev => ({ ...prev, body: e.target.value }))
            if (errors.body) {
              setErrors(prev => ({ ...prev, body: undefined }))
            }
          }}
          placeholder="Enter announcement body"
          className={cn(
            'block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            errors.body ? 'border-destructive' : ''
          )}
          rows={8}
        />
        {errors.body && <p className="text-sm text-destructive">{errors.body}</p>}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (isEditing ? 'Updating announcement...' : 'Creating announcement...') : (isEditing ? 'Update announcement' : 'Create announcement')}
      </Button>
    </form>
  )
}