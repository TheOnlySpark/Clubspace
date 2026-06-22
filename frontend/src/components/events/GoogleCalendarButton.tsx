// src/components/events/GoogleCalendarButton.tsx
"use client"
export function buildGoogleCalendarUrl(event: {
  title: string; description?: string; location?: string; starts_at: string; ends_at: string
}) {
  const fmt = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const params = new URLSearchParams({
    action: 'TEMPLATE', text: event.title,
    dates: `${fmt(event.starts_at)}/${fmt(event.ends_at)}`,
    details: event.description ?? '', location: event.location ?? '',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export default function GoogleCalendarButton({ event }: { event: any }) {
  return (
    <a href={buildGoogleCalendarUrl(event)} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
      Add to Google Calendar
    </a>
  )
}