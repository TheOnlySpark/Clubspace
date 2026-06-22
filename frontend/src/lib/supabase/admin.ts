// src/lib/supabase/admin.ts
// NEVER import this file in any client component
import { createClient } from '@supabase/supabase-js'
export const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key'
)