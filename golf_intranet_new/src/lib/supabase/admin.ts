import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Service Role 키를 사용하는 Admin 클라이언트
 * RLS 정책을 우회하며, 서버 사이드에서만 사용해야 함
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
