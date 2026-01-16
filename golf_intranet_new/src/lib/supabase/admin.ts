/**
 * Supabase Admin Client
 *
 * This client uses the service_role key to bypass RLS policies.
 * Should ONLY be used in API routes on the server side.
 * NEVER expose this client to the frontend.
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database.types'

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
}

/**
 * Admin Supabase client with service_role key
 * Bypasses all RLS policies - use with caution!
 */
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

/**
 * Type helper for API response
 */
export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string }

/**
 * Helper to create successful API response
 */
export function success<T>(data: T): ApiResponse<T> {
  return { data, error: null }
}

/**
 * Helper to create error API response
 */
export function error(message: string): ApiResponse<never> {
  return { data: null, error: message }
}
