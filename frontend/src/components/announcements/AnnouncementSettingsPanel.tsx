// src/components/announcements/AnnouncementSettingsPanel.tsx
"use client"
import * as React from 'react'
import { useState, useEffect } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import type { AnnouncementSettings } from '@/types'

export default function AnnouncementSettingsPanel() {
  const [settings, setSettings] = useState<AnnouncementSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/announcement-settings')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setSettings(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/admin/announcement-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          require_approval_for_officers: settings.require_approval_for_officers,
          max_pinned_per_club: settings.max_pinned_per_club,
          allow_club_public_visibility: settings.allow_club_public_visibility,
          retention_days: settings.retention_days,
          branding_color: settings.branding_color,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-slate-400 py-4">Loading settings...</div>
  if (!settings) return <div className="text-red-400 py-4">Failed to load settings</div>

  return (
    <div className="space-y-6 rounded-xl border border-slate-700 bg-slate-800 p-6">
      <h3 className="text-lg font-semibold text-slate-100">Announcement Settings</h3>

      {error && (
        <div className="rounded-lg bg-red-900/30 border border-red-700 px-4 py-3 text-sm text-red-300">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-emerald-900/30 border border-emerald-700 px-4 py-3 text-sm text-emerald-300">Settings saved!</div>
      )}

      {/* Require approval for officers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-200">Require approval for Officers</p>
          <p className="text-xs text-slate-500">Officers must submit drafts for Club Admin approval</p>
        </div>
        <button
          type="button"
          onClick={() => setSettings(prev => prev ? { ...prev, require_approval_for_officers: !prev.require_approval_for_officers } : prev)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            settings.require_approval_for_officers ? 'bg-blue-600' : 'bg-slate-600'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            settings.require_approval_for_officers ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>

      {/* Allow club public visibility */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-200">Allow public visibility for clubs</p>
          <p className="text-xs text-slate-500">Clubs can publish announcements visible outside the university</p>
        </div>
        <button
          type="button"
          onClick={() => setSettings(prev => prev ? { ...prev, allow_club_public_visibility: !prev.allow_club_public_visibility } : prev)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            settings.allow_club_public_visibility ? 'bg-blue-600' : 'bg-slate-600'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            settings.allow_club_public_visibility ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>

      {/* Max pinned per club */}
      <div>
        <label className="block text-sm font-medium text-slate-200 mb-2">Max pinned per club</label>
        <Input
          type="number"
          min={0}
          max={10}
          value={settings.max_pinned_per_club}
          onChange={(e) => setSettings(prev => prev ? { ...prev, max_pinned_per_club: parseInt(e.target.value) || 0 } : prev)}
          className="w-24"
        />
      </div>

      {/* Retention days */}
      <div>
        <label className="block text-sm font-medium text-slate-200 mb-2">
          Retention period <span className="text-slate-500">(days)</span>
        </label>
        <Input
          type="number"
          min={30}
          max={3650}
          value={settings.retention_days}
          onChange={(e) => setSettings(prev => prev ? { ...prev, retention_days: parseInt(e.target.value) || 365 } : prev)}
          className="w-32"
        />
        <p className="text-xs text-slate-500 mt-1">Announcements older than this auto-archive (GDPR aligned)</p>
      </div>

      {/* Branding color */}
      <div>
        <label className="block text-sm font-medium text-slate-200 mb-2">Branding color</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={settings.branding_color}
            onChange={(e) => setSettings(prev => prev ? { ...prev, branding_color: e.target.value } : prev)}
            className="h-10 w-10 rounded-lg border border-slate-700 cursor-pointer"
          />
          <span className="text-sm text-slate-400 font-mono">{settings.branding_color}</span>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  )
}
