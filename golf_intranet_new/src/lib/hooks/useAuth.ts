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
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) throw userError

        if (user) {
          // 이메일에서 username 추출 (예: admin@internal.golf.local -> admin)
          const username = user.email?.split('@')[0]

          if (!username) {
            throw new Error('Username not found in email')
          }

          // 프로필 정보 로드
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single()

          if (profileError) throw profileError

          setState({ user, profile, loading: false, error: null })
        } else {
          setState({ user: null, profile: null, loading: false, error: null })
        }
      } catch (error) {
        console.error('Error loading user:', error)
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
      if (session?.user) {
        // 이메일에서 username 추출
        const username = session.user.email?.split('@')[0]

        if (username) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single()

          setState({
            user: session.user,
            profile: profile || null,
            loading: false,
            error: null,
          })
        } else {
          setState({
            user: session.user,
            profile: null,
            loading: false,
            error: 'Username not found',
          })
        }
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
