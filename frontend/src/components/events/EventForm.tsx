// src/components/events/EventForm.tsx
"use client"
import * as React from 'react'
import { useState } from 'react'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { eventSchema } from '@/lib/validations/events'

interface EventFormProps {
  onSubmit: (eventData: z.infer<typeof eventSchema>) => Promise<void>
  initialData?: Partial<z.infer<typeof eventSchema>>
  isEditing?: boolean
}

export default function EventForm({
  onSubmit,
  initialData,
  isEditing = false,
}: EventFormProps) {
  const [formData, setFormData] = useState<z.infer<typeof eventSchema>>({
    title: '',
    description: '',
    location: '',
    starts_at: '',
    ends_at: '',
    capacity: undefined,
    status: 'draft',
    ...(initialData || {}),
  })
  const [errors, setErrors] = useState<Partial<Record<keyof z.infer<typeof eventSchema>, string>>>({})
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
      const parsed = eventSchema.parse(formData)
      await onSubmit(parsed)
      // Optionally reset form on success
      // setFormData({ ...initialData, ...defaultValues })
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof z.infer<typeof eventSchema>, string>> = {}
        err.issues.forEach(error => {
          const field = error.path[0] as keyof z.infer<typeof eventSchema>
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
          Event title
        </label>
        <Input
          id="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter event title"
          required
          className={cn('w-full', errors.title ? 'border-destructive' : '')}
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
      </div>
      <div>
        <label htmlFor="description" className="mb-2 block text-sm font-medium text-muted-foreground">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={e => {
            setFormData(prev => ({ ...prev, description: e.target.value }))
            if (errors.description) {
              setErrors(prev => ({ ...prev, description: undefined }))
            }
          }}
          placeholder="Enter event description"
          className={cn(
            'block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            errors.description ? 'border-destructive' : ''
          )}
          rows={4}
        />
        {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
      </div>
      <div>
        <label htmlFor="location" className="mb-2 block text-sm font-medium text-muted-foreground">
          Location
        </label>
        <Input
          id="location"
          type="text"
          value={formData.location}
          onChange={handleChange}
          placeholder="Enter event location"
          className={cn('w-full', errors.location ? 'border-destructive' : '')}
        />
        {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="starts_at" className="mb-2 block text-sm font-medium text-muted-foreground">
            Starts at
          </label>
          <Input
            id="starts_at"
            type="datetime-local"
            value={formData.starts_at}
            onChange={e => {
              setFormData(prev => ({ ...prev, starts_at: e.target.value }))
              if (errors.starts_at) {
                setErrors(prev => ({ ...prev, starts_at: undefined }))
              }
            }}
            required
            className={cn('w-full', errors.starts_at ? 'border-destructive' : '')}
          />
          {errors.starts_at && <p className="text-sm text-destructive">{errors.starts_at}</p>}
        </div>
        <div>
          <label htmlFor="ends_at" className="mb-2 block text-sm font-medium text-muted-foreground">
            Ends at
          </label>
          <Input
            id="ends_at"
            type="datetime-local"
            value={formData.ends_at}
            onChange={e => {
              setFormData(prev => ({ ...prev, ends_at: e.target.value }))
              if (errors.ends_at) {
                setErrors(prev => ({ ...prev, ends_at: undefined }))
              }
            }}
            required
            className={cn('w-full', errors.ends_at ? 'border-destructive' : '')}
          />
          {errors.ends_at && <p className="text-sm text-destructive">{errors.ends_at}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="capacity" className="mb-2 block text-sm font-medium text-muted-foreground">
            Capacity (optional)
          </label>
          <Input
            id="capacity"
            type="number"
            value={formData.capacity ?? ''}
            onChange={e => {
              const value = e.target.value
              setFormData(prev => ({ ...prev, capacity: value === '' ? undefined : Number(value) }))
              if (errors.capacity) {
                setErrors(prev => ({ ...prev, capacity: undefined }))
              }
            }}
            className={cn('w-full', errors.capacity ? 'border-destructive' : '')}
          />
          {errors.capacity && <p className="text-sm text-destructive">{errors.capacity}</p>}
        </div>
        <div>
          <label htmlFor="status" className="mb-2 block text-sm font-medium text-muted-foreground">
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={e => {
              setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' | 'cancelled' }))
              if (errors.status) {
                setErrors(prev => ({ ...prev, status: undefined }))
              }
            }}
            className={cn(
              'block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-file placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              errors.status ? 'border-destructive' : ''
            )}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {errors.status && <p className="text-sm text-destructive">{errors.status}</p>}
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (isEditing ? 'Updating event...' : 'Creating event...') : (isEditing ? 'Update event' : 'Create event')}
      </Button>
    </form>
  )
}