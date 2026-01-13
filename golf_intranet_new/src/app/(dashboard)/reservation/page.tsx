'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCourseTimeStore } from '@/lib/stores/course-time-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function ReservationPage() {
  const router = useRouter()
  const { courseTimes, loading, fetchCourseTimes } = useCourseTimeStore()

  useEffect(() => {
    fetchCourseTimes({
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    })
  }, [fetchCourseTimes])

  // 조인이 있는 타임만 필터링
  const reservedTimes = courseTimes.filter((time) => time.join_num > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">예약 관리</h1>
          <p className="text-muted-foreground mt-1">조인 예약 현황을 관리합니다</p>
        </div>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              로딩 중...
            </CardContent>
          </Card>
        ) : reservedTimes.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
              조인 예약이 없습니다
            </CardContent>
          </Card>
        ) : (
          reservedTimes.map((time) => (
            <Card key={time.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {time.courses?.golf_club_name || '골프장'} -{' '}
                      {time.courses?.course_name || '코스'}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {format(new Date(time.reserved_time), 'yyyy-MM-dd (E) HH:mm', {
                        locale: ko,
                      })}
                    </CardDescription>
                  </div>
                  <Badge variant={time.status === '판매완료' ? 'default' : 'secondary'}>
                    {time.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">예약자: {time.reserved_name}</p>
                    <p className="text-sm text-muted-foreground">
                      그린피: {time.green_fee.toLocaleString()}원
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm font-semibold">조인:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                              i <= time.join_num
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {i}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button onClick={() => router.push(`/dashboard/reservation/detail?id=${time.id}`)}>
                    <Eye className="mr-2 h-4 w-4" />
                    상세 보기
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
