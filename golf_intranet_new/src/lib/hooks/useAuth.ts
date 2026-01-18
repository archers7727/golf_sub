import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

type UserProfile = Database['public']['Tables']['users']['Row']

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
}

// Global cache to prevent re-fetching on every navigation
let globalAuthState: AuthState | null = null
let authPromise: Promise<void> | null = null

export function useAuth() {
  const [state, setState] = useState<AuthState>(
    globalAuthState || {
      user: null,
      profile: null,
      loading: true,
      error: null,
    }
  )

  useEffect(() => {
    // If already loaded, use cached state
    if (globalAuthState && !globalAuthState.loading) {
      setState(globalAuthState)
      return
    }

    const supabase = createClient()

    // 초기 사용자 로드
    const loadUser = async () => {
      // Prevent multiple simultaneous loads
      if (authPromise) {
        await authPromise
        if (globalAuthState) {
          setState(globalAuthState)
        }
        return
      }

      authPromise = (async () => {
        try {
          console.log('[useAuth] Loading user...')
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser()

          if (userError) throw userError

          console.log('[useAuth] User loaded:', user?.id)

          if (user) {
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single()

            if (profileError) {
              console.error('[useAuth] Profile error:', profileError)
              throw profileError
            }

            console.log('[useAuth] Profile loaded:', profile ? (profile as UserProfile).name : null)
            const newState = { user, profile, loading: false, error: null }
            globalAuthState = newState
            setState(newState)
          } else {
            console.log('[useAuth] No user found')
            const newState = { user: null, profile: null, loading: false, error: null }
            globalAuthState = newState
            setState(newState)
          }
        } catch (error) {
          console.error('[useAuth] Error loading user:', error)
          const newState = {
            user: null,
            profile: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
          globalAuthState = newState
          setState(newState)
        } finally {
          authPromise = null
        }
      })()

      await authPromise
    }

    loadUser()

    // Auth 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[useAuth] Auth state changed:', event)

      // INITIAL_SESSION 이벤트는 loadUser에서 이미 처리했으므로 무시
      if (event === 'INITIAL_SESSION') {
        return
      }

      if (event === 'SIGNED_OUT') {
        const newState = { user: null, profile: null, loading: false, error: null }
        globalAuthState = newState
        setState(newState)
        return
      }

      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        const newState = {
          user: session.user,
          profile: profile || null,
          loading: false,
          error: null,
        }
        globalAuthState = newState
        setState(newState)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return state
}
