// src/lib/validations/clubs.ts
import { z } from 'zod';

export const clubSchema = z.object({
  name: z.string().min(1, 'Club name is required').max(100),
  description: z.string().max(500).optional(),
  privacy: z.enum(['public', 'university', 'members']).default('university'),
  join_policy: z.enum(['open', 'invite', 'approval']).default('invite'),
  university_id: z.string().uuid().optional(),
});

export const clubIdSchema = z.object({
  id: z.string().uuid('Invalid club ID'),
});