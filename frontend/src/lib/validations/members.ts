// src/lib/validations/members.ts
import { z } from 'zod';

export const memberRoleSchema = z.object({
  role: z.enum(['admin', 'officer', 'member']),
});

export const memberIdSchema = z.object({
  uid: z.string().uuid('Invalid user ID'),
});