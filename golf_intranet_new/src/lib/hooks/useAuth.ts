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

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    const supabase = createClient()

    // 초기 사용자 로드
    const loadUser = async () => {
      try {
        console.log('[useAuth] Loading user...')
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) throw userError

        console.log('[useAuth] User loaded:', user?.id)

        if (user) {
          // users.id는 auth.users를 참조하므로 user.id로 직접 조회
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
          setState({ user, profile, loading: false, error: null })
        } else {
          console.log('[useAuth] No user found')
          setState({ user: null, profile: null, loading: false, error: null })
        }
      } catch (error) {
        console.error('[useAuth] Error loading user:', error)
        setState({
          user: null,
          profile: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
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

      if (session?.user) {
        // users.id는 auth.users를 참조하므로 user.id로 직접 조회
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        setState({
          user: session.user,
          profile: profile || null,
          loading: false,
          error: null,
        })
      } else {
        setState({ user: null, profile: null, loading: false, error: null })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return state
}
