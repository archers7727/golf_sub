import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Calendar,
  Users,
  Shield,
  BarChart3,
  Settings,
  LogOut,
  Clock,
  UserX,
  PlusCircle,
  FileText,
  DollarSign,
  Menu,
} from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

type UserProfile = Database['public']['Tables']['users']['Row']

const navigation = [
  { name: '코스 타임', href: '/dashboard/course-time', icon: Calendar },
  { name: '타임 등록', href: '/dashboard/course-time/register', icon: PlusCircle },
  { name: '텍스트 뷰', href: '/dashboard/course-time/text-view', icon: FileText },
  { name: '예약 관리', href: '/dashboard/reservation', icon: Clock },
  { name: '블랙리스트', href: '/dashboard/black-list', icon: UserX },
  { name: '내 실적', href: '/dashboard/my-performance', icon: BarChart3 },
  { name: '사이트ID 현황', href: '/dashboard/site-id-status', icon: Shield },
]

const adminNavigation = [
  { name: '유저 관리', href: '/dashboard/admin/users', icon: Users },
  { name: '사이트ID 관리', href: '/dashboard/admin/site-ids', icon: Settings },
  { name: '입금 관리', href: '/dashboard/admin/deposit', icon: DollarSign },
  { name: '전체 실적', href: '/dashboard/admin/performance', icon: BarChart3 },
]

interface SidebarProps {
  profile: UserProfile
}

export function Sidebar({ profile }: SidebarProps) {
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const isAdmin = profile.type === 'admin'

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      toast.success('로그아웃 되었습니다')
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('로그아웃 실패')
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col bg-white border-r transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!isCollapsed && (
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Golf Intranet
          </h1>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6">
        <div className="px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = router.pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start transition-all',
                    isActive && 'bg-blue-50 text-blue-600 hover:bg-blue-100',
                    isCollapsed && 'justify-center'
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon className={cn('h-5 w-5', !isCollapsed && 'mr-3')} />
                  {!isCollapsed && item.name}
                </Button>
              </Link>
            )
          })}
        </div>

        {isAdmin && (
          <>
            <Separator className="my-4" />
            <div className="px-3">
              {!isCollapsed && (
                <p className="px-4 text-xs font-semibold text-muted-foreground mb-2">
                  관리자 메뉴
                </p>
              )}
              <div className="space-y-1">
                {adminNavigation.map((item) => {
                  const isActive = router.pathname === item.href
                  return (
                    <Link key={item.name} href={item.href}>
                      <Button
                        variant={isActive ? 'secondary' : 'ghost'}
                        className={cn(
                          'w-full justify-start transition-all',
                          isActive && 'bg-blue-50 text-blue-600 hover:bg-blue-100',
                          isCollapsed && 'justify-center'
                        )}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <item.icon className={cn('h-5 w-5', !isCollapsed && 'mr-3')} />
                        {!isCollapsed && item.name}
                      </Button>
                    </Link>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* User Info & Logout */}
      <div className="border-t p-4">
        {!isCollapsed && profile && (
          <div className="mb-3 px-2">
            <p className="text-sm font-medium truncate">{profile.name}</p>
            <p className="text-xs text-muted-foreground truncate">{profile.phone_number}</p>
          </div>
        )}
        <Button
          variant="outline"
          className={cn('w-full', isCollapsed && 'justify-center')}
          onClick={handleLogout}
          title={isCollapsed ? '로그아웃' : undefined}
        >
          <LogOut className={cn('h-4 w-4', !isCollapsed && 'mr-2')} />
          {!isCollapsed && '로그아웃'}
        </Button>
      </div>
    </div>
  )
}
