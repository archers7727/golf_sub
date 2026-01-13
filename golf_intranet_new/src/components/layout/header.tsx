'use client'

import { usePathname } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/hooks/useAuth'

const pageNames: Record<string, string> = {
  '/dashboard/course-time': '코스 타임 관리',
  '/dashboard/course-time/register': '타임 등록',
  '/dashboard/course-time/text-view': '텍스트 뷰',
  '/dashboard/reservation': '예약 관리',
  '/dashboard/black-list': '블랙리스트',
  '/dashboard/my-performance': '내 실적',
  '/dashboard/site-id-status': '사이트ID 현황',
  '/dashboard/admin/manage-users': '유저 관리',
  '/dashboard/admin/manage-site-ids': '사이트ID 관리',
  '/dashboard/admin/deposit': '입금 관리',
  '/dashboard/admin/performance': '전체 실적',
}

export function Header() {
  const pathname = usePathname()
  const { profile } = useAuth()
  const pageName = pageNames[pathname] || 'Dashboard'

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">{pageName}</h2>
      </div>
      <div className="flex items-center gap-3">
        {profile && (
          <Badge variant={profile.type === 'admin' ? 'default' : 'secondary'}>
            {profile.type === 'admin' ? '관리자' : '매니저'}
          </Badge>
        )}
      </div>
    </header>
  )
}
