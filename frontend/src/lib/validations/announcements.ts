// src/lib/validations/announcements.ts
import { z } from 'zod';

export const announcementSchema = z.object({
  title: z.string().min(1, 'Announcement title is required').max(200),
  body: z.string().min(1, 'Announcement body is required'),
  club_id: z.string().uuid('Invalid club ID'),
});