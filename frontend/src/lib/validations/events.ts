// src/lib/validations/events.ts
import { z } from 'zod';

export const eventSchema = z.object({
  title: z.string().min(1, 'Event title is required').max(200),
  description: z.string().max(1000).optional(),
  location: z.string().max(200).optional(),
  starts_at: z.string().datetime({ offset: true }).or(z.string()),
  ends_at: z.string().datetime({ offset: true }).or(z.string()),
  capacity: z.number().int().positive().optional(),
  status: z.enum(['draft', 'published', 'cancelled']).default('draft'),
});

export const eventIdSchema = z.object({
  id: z.string().uuid('Invalid event ID'),
});