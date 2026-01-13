import { useEffect, ComponentType } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from './useAuth'

/**
 * HOC: 인증이 필요한 페이지를 감싸는 컴포넌트
 * @param Component 보호할 페이지 컴포넌트
 * @param options.requireAdmin 관리자 권한 필요 여부
 */
export function withAuth<P extends object>(
  Component: ComponentType<P>,
  options: { requireAdmin?: boolean } = {}
) {
  return function ProtectedPage(props: P) {
    const router = useRouter()
    const { user, profile, loading } = useAuth()

    useEffect(() => {
      // 로딩 중이면 대기
      if (loading) return

      // 로그인하지 않은 경우
      if (!user) {
        router.replace('/')
        return
      }

      // 관리자 권한이 필요한 경우
      if (options.requireAdmin && profile?.type !== 'admin') {
        router.replace('/dashboard/course-time')
        return
      }
    }, [user, profile, loading, router])

    // 로딩 중
    if (loading) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      )
    }

    // 인증되지 않음
    if (!user || !profile) {
      return null
    }

    // 관리자 권한 없음
    if (options.requireAdmin && profile.type !== 'admin') {
      return null
    }

    // 인증됨
    return <Component {...props} user={user} profile={profile} />
  }
}

/**
 * 사용 예시:
 *
 * // 일반 사용자 페이지
 * export default withAuth(CourseTimePage)
 *
 * // 관리자 전용 페이지
 * export default withAuth(AdminUsersPage, { requireAdmin: true })
 */
