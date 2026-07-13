// src/lib/validations/announcements.ts
import { z } from 'zod';

export const announcementCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(150, 'Title must be 150 characters or less'),
  body: z.string().min(1, 'Body is required').max(5000, 'Body must be 5000 characters or less'),
  club_id: z.string().uuid('Invalid club ID').nullable(),
  visibility: z.enum(['club', 'university', 'public']),
  status: z.enum(['draft', 'pending_approval', 'published']).optional().default('draft'),
  pinned: z.boolean().optional().default(false),
  publish_at: z.string().datetime().nullable().optional(),
  expires_at: z.string().datetime().nullable().optional(),
});

export const announcementUpdateSchema = announcementCreateSchema.partial();

export const approvalSchema = z.object({
  rejection_reason: z.string().max(500).optional(),
});

export const announcementSettingsSchema = z.object({
  require_approval_for_officers: z.boolean().optional(),
  max_pinned_per_club: z.number().int().min(0).max(10).optional(),
  allow_club_public_visibility: z.boolean().optional(),
  retention_days: z.number().int().min(30).max(3650).optional(),
  branding_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
});

// Keep backward compat alias
export const announcementSchema = announcementCreateSchema;