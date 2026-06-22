// src/components/events/EventCard.tsx
"use client"
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'

interface EventCardProps {
  event: {
    id: string
    title: string
    description?: string
    location?: string
    starts_at: string
    ends_at: string
    capacity?: number
    status: string
  }
  showActions?: boolean
}

export default function EventCard({
  event,
  showActions = false,
}: EventCardProps) {
  const startDate = new Date(event.starts_at)
  const endDate = new Date(event.ends_at)

  return (
    <div className="border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-4">
        <div className="flex items-start space-x-4">
          {/* Placeholder for event image/icon */}
          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
            📅
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-primary">{event.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {event.description || 'No description'}
            </p>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div className="flex items-center">
                <span>📍</span>
                <span>{event.location || 'TBD'}</span>
              </div>
              <div className="flex items-center">
                <span>🕒</span>
                <span>
                  {startDate.toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })} {startDate.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })} -
                  {endDate.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {event.capacity && (
                <div className="flex items-center">
                  <span>👥</span>
                  <span>{event.capacity} capacity</span>
                </div>
              )}
            </div>
            {showActions && (
              <div className="mt-3 flex space-x-3">
                {/* Action buttons would go here */}
                <button className="text-sm text-primary hover:underline">Edit</button>
                <button className="text-sm text-destructive hover:underline">Delete</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}