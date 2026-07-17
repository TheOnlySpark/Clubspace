// src/components/announcements/PinnedBanner.tsx
"use client"
import * as React from 'react'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import { cn } from '@/lib/utils'

interface PinnedBannerProps {
  clubId?: string
  className?: string
}

export default function PinnedBanner({ clubId, className }: PinnedBannerProps) {
  const { announcements, loading } = useAnnouncements({
    clubId,
    status: 'published',
    pinned: true,
    limit: 1,
  })

  if (loading || announcements.length === 0) return null

  const pinned = announcements[0]

  return (
    <div className={cn(
      'rounded-xl border border-blue-600/30 bg-gradient-to-r from-blue-900/30 to-slate-800 p-4 mb-6',
      className
    )}>
      <div className="flex items-start gap-3">
        <span className="flex items-center justify-center"><img src="/icons/pin.svg" alt="Pinned" className="w-5 h-5 invert opacity-70" /></span>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-blue-200">{pinned.title}</h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{pinned.body}</p>
        </div>
        {pinned.club_name && (
          <span className="text-xs text-slate-500 shrink-0">{pinned.club_name}</span>
        )}
      </div>
    </div>
  )
}
