import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useCourseTimeStore } from '@/lib/stores/course-time-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { withAuth } from '@/lib/hooks/useRequireAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

function ReservationPage({ profile }: any) {
  const router = useRouter()
  const { courseTimes, loading, fetchCourseTimes } = useCourseTimeStore()

  // Filter states
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    // Load all times (no date filter by default)
    fetchCourseTimes({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleApplyFilters = () => {
    fetchCourseTimes({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      search: searchQuery || undefined,
    })
  }

  const handleClearFilters = () => {
    setStartDate('')
    setEndDate('')
    setSearchQuery('')
    fetchCourseTimes({})
  }

  // Show all times (removed join_num > 0 filter)
  const reservedTimes = courseTimes

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">예약 관리</h1>
            <p className="text-muted-foreground mt-1">전체 예약 현황을 관리합니다</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            필터 {showFilters ? '숨기기' : '보기'}
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">필터</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">시작 날짜</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">종료 날짜</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="search">검색</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="골프장, 예약자명 검색"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleApplyFilters()
                      }}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleApplyFilters}>
                  <Search className="mr-2 h-4 w-4" />
                  검색
                </Button>
                <Button variant="outline" onClick={handleClearFilters}>
                  초기화
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
                    <Button onClick={() => router.push(`/dashboard/reservation/${time.id}`)}>
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
    </DashboardLayout>
  )
}

export default withAuth(ReservationPage)
