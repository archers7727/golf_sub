import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { useCourseTimeStore } from '@/lib/stores/course-time-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Plus, Clock, DollarSign, FastForward } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import { withAuth } from '@/lib/hooks/useRequireAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

// Flag 비트마스크
const FLAG_URGENT = 1  // 임박
const FLAG_COST = 2    // 원가
const FLAG_JOIN = 4    // 조인

function TextViewPage({ profile }: any) {
  const router = useRouter()
  const { courseTimes, loading, fetchCourseTimes } = useCourseTimeStore()

  useEffect(() => {
    // 과거 7일 ~ 미래 30일 범위로 조회
    const today = new Date()
    const startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

    fetchCourseTimes({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 날짜별 그룹핑
  const groupedTimes = useMemo(() => {
    const groups: Record<string, typeof courseTimes> = {}
    courseTimes.forEach((time) => {
      const dateKey = format(new Date(time.reserved_time), 'MM/dd(E)', { locale: ko })
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(time)
    })
    return groups
  }, [courseTimes])

  return (
    <DashboardLayout profile={profile}>
      <div className="min-h-screen bg-white p-2 pb-24">
        {/* 모바일 최적화된 헤더 */}
        <div className="sticky top-0 bg-white border-b pb-2 mb-4 z-10">
          <h1 className="text-xl font-bold">텍스트 뷰</h1>
          <p className="text-sm text-muted-foreground">
            {courseTimes.length}개의 타임
          </p>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-8">로딩 중...</div>
        ) : Object.entries(groupedTimes).length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            등록된 타임이 없습니다
          </div>
        ) : (
          <>
            {Object.entries(groupedTimes).map(([date, times]) => (
              <div key={date} className="mb-6">
                <h3 className="text-lg font-bold text-red-600 mb-2 sticky top-14 bg-white py-1">
                  {date}
                </h3>
                <div className="space-y-1">
                  {times.map((time) => (
                    <Link
                      key={time.id}
                      href={`/dashboard/reservation/${time.id}`}
                      className="block text-sm p-2 hover:bg-slate-50 rounded transition-colors active:bg-slate-100"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Flag badges */}
                        {time.flag & FLAG_URGENT && (
                          <Badge variant="default" className="px-1 py-0 text-xs">
                            <Clock className="h-3 w-3" />
                          </Badge>
                        )}
                        {time.flag & FLAG_COST && (
                          <Badge variant="default" className="px-1 py-0 text-xs">
                            <DollarSign className="h-3 w-3" />
                          </Badge>
                        )}
                        {time.flag & FLAG_JOIN && (
                          <Badge variant="default" className="px-1 py-0 text-xs">
                            <FastForward className="h-3 w-3" />
                          </Badge>
                        )}
                        <span className="font-bold text-blue-600">
                          {time.courses?.golf_club_name?.slice(0, 3) || '골프장'}
                        </span>
                        <span className="text-muted-foreground">
                          {time.courses?.course_name?.slice(0, 2) || '코스'}
                        </span>
                        <span className="font-medium">
                          {format(new Date(time.reserved_time), 'HH:mm')}
                        </span>
                        <span className="text-blue-600">{time.reserved_name}</span>
                        <span className="text-muted-foreground">
                          {Math.floor(time.green_fee / 10000)}+{Math.floor(time.charge_fee / 10000)}
                        </span>
                        {time.requirements !== '조건없음' && (
                          <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                            {time.requirements}
                          </span>
                        )}
                        {time.join_num > 0 && (
                          <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-medium">
                            조인 {time.join_num}/4
                          </span>
                        )}
                      </div>
                      {time.memo && (
                        <div className="text-xs text-muted-foreground mt-1">{time.memo}</div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {/* 플로팅 액션 버튼 */}
        <div className="fixed right-4 bottom-4 flex flex-col gap-3">
          <Button
            size="lg"
            className="rounded-full w-14 h-14 shadow-lg"
            onClick={() => {
              const today = new Date()
              const startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
              const endDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
              fetchCourseTimes({
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
              })
            }}
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
          <Button
            size="lg"
            className="rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600"
            onClick={() => router.push('/dashboard/course-time/register')}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default withAuth(TextViewPage)
