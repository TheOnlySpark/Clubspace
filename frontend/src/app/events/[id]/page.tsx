// src/app/events/[id]/page.tsx
import GoogleCalendarButton from '@/components/events/GoogleCalendarButton'

export default function EventPage({ params }: { params: { id: string } }) {
  // In a real app, we would fetch the event from the database
  // For now, we'll show a placeholder
  const eventId = params.id

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-6">Event Details</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-muted-foreground">
            Event ID: {eventId}
          </p>
          <p className="text-muted-foreground">
            This is a placeholder for the event page.
            In a real implementation, we would fetch the event details from the database.
          </p>
          {/* Placeholder event data for Google Calendar button */}
          <GoogleCalendarButton
            event={{
              title: 'Sample Event',
              description: 'This is a sample event description.',
              location: 'Online',
              starts_at: new Date().toISOString(),
              ends_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
            }}
          />
        </div>
      </div>
    </div>
  )
}