import { z } from 'zod';

export const clubSchema = z.object({
  name: z.string().min(2, 'Club name must be at least 2 characters').max(100),
  description: z.string().max(2000).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  status: z.enum(['active', 'archived']).default('active'),
  logo_url: z.string().url().optional().nullable(),
  banner_url: z.string().url().optional().nullable(),
  contact_email: z.string().email().optional().nullable(),
  social_links: z.record(z.string(), z.string()).optional(),
  // For backwards compatibility
  privacy: z.enum(['public', 'university', 'members']).default('university'),
  join_policy: z.enum(['open', 'invite', 'approval']).default('invite'),
  university_id: z.string().uuid().optional(),
});

export const clubCreateSchema = clubSchema.extend({
  initial_admin_id: z.string().uuid('Initial admin is required'),
});

export const clubIdSchema = z.object({
  id: z.string().uuid('Invalid club ID'),
});

export const clubCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50),
});

export const clubSettingsSchema = z.object({
  require_contact_email: z.boolean().default(true),
  require_description: z.boolean().default(false),
  allow_club_admin_logo_change: z.boolean().default(true),
});