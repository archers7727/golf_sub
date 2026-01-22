import { useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useQueryClient } from '@tanstack/react-query'
import { useCourseTimesQuery, useDeleteCourseTimeMutation, courseTimeKeys, type CourseTimeFilters } from '@/lib/hooks/useCourseTimesQuery'
import { joinPersonKeys } from '@/lib/hooks/useJoinPersonsQuery'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Filter, MoreHorizontal, Pencil, Trash2, Eye, Clock, DollarSign, FastForward, Search } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'
import { withAuth } from '@/lib/hooks/useRequireAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

// Flag 비트마스크
const FLAG_URGENT = 1  // 임박
const FLAG_COST = 2    // 원가
const FLAG_JOIN = 4    // 조인

function CourseTimePage({ profile }: any) {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Filter states
  const [filters, setFilters] = useState<CourseTimeFilters>({})
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // React Query hooks
  const { data: courseTimes = [], isLoading: loading, error } = useCourseTimesQuery(filters)
  const deleteMutation = useDeleteCourseTimeMutation()

  // 마우스 호버 시 예약 상세 데이터 미리 가져오기
  const prefetchReservation = useCallback((timeId: string) => {
    queryClient.prefetchQuery({
      queryKey: courseTimeKeys.detail(timeId),
      queryFn: () => fetch(`/api/course-times?id=${timeId}`).then(res => res.json()),
      staleTime: 5 * 60 * 1000,
    })
    queryClient.prefetchQuery({
      queryKey: joinPersonKeys.list(timeId),
      queryFn: () => fetch(`/api/join-persons?timeId=${timeId}`).then(res => res.json()),
      staleTime: 5 * 60 * 1000,
    })
  }, [queryClient])

  const handleApplyFilters = () => {
    setFilters({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
  }

  const handleClearFilters = () => {
    setStartDate('')
    setEndDate('')
    setSearchQuery('')
    setFilters({})
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success('삭제 완료', {
          description: '타임이 성공적으로 삭제되었습니다.',
        })
      },
      onError: (error: any) => {
        toast.error('삭제 실패', {
          description: error.message,
        })
      },
    })
  }

  const getStatusVariant = (
    status: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case '판매완료':
        return 'default'
      case '미판매':
        return 'secondary'
      case '타업체마감':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">코스 타임 관리</h1>
            <p className="text-muted-foreground mt-1">골프장 예약 타임을 관리합니다</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              필터 {showFilters ? '숨기기' : '보기'}
            </Button>
            <Button onClick={() => router.push('/dashboard/course-time/register')}>
              <Plus className="mr-2 h-4 w-4" />
              타임 등록
            </Button>
          </div>
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

        <Card>
          <CardHeader>
            <CardTitle>타임 목록</CardTitle>
            <CardDescription>
              {courseTimes.length}개의 타임이 등록되어 있습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                로딩 중...
              </div>
            ) : courseTimes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <p>등록된 타임이 없습니다</p>
                <Button
                  variant="link"
                  onClick={() => router.push('/dashboard/course-time/register')}
                  className="mt-2"
                >
                  새 타임 등록하기
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>작성자</TableHead>
                      <TableHead>골프장</TableHead>
                      <TableHead>예약일</TableHead>
                      <TableHead>코스</TableHead>
                      <TableHead>타임</TableHead>
                      <TableHead>예약자명</TableHead>
                      <TableHead>그린피</TableHead>
                      <TableHead>조인인원</TableHead>
                      <TableHead>조건</TableHead>
                      <TableHead>메모</TableHead>
                      <TableHead>조인현황</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courseTimes.map((time) => (
                      <TableRow key={time.id}>
                        {/* 작성자 */}
                        <TableCell className="font-medium">
                          {time.users?.name || '-'}
                        </TableCell>

                        {/* 골프장 - clickable with prefetch on hover */}
                        <TableCell>
                          <button
                            onClick={() => router.push(`/dashboard/reservation/${time.id}`)}
                            onMouseEnter={() => prefetchReservation(time.id)}
                            className="text-blue-600 hover:underline text-left"
                          >
                            {time.courses?.golf_club_name || '-'}
                          </button>
                        </TableCell>

                        {/* 예약일 - 날짜와 요일 */}
                        <TableCell>
                          {format(new Date(time.reserved_time), 'MM/dd(E)', {
                            locale: ko,
                          })}
                        </TableCell>

                        {/* 코스 */}
                        <TableCell>{time.courses?.course_name || '-'}</TableCell>

                        {/* 타임 - 시간만 */}
                        <TableCell>
                          {format(new Date(time.reserved_time), 'HH:mm', {
                            locale: ko,
                          })}
                        </TableCell>

                        {/* 예약자명 */}
                        <TableCell>{time.reserved_name}</TableCell>

                        {/* 그린피 */}
                        <TableCell>
                          {Math.floor(time.green_fee / 10000)}+{Math.floor(time.charge_fee / 10000)}
                        </TableCell>

                        {/* 조인인원 */}
                        <TableCell>
                          <span className="font-semibold">{time.join_num}</span>/4
                        </TableCell>

                        {/* 조건 - flags with status badge */}
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <div className="flex gap-1">
                              {time.flag & FLAG_URGENT && (
                                <Badge variant="default" className="px-1.5 py-0 text-xs">
                                  <Clock className="h-3 w-3" />
                                </Badge>
                              )}
                              {time.flag & FLAG_COST && (
                                <Badge variant="default" className="px-1.5 py-0 text-xs">
                                  <DollarSign className="h-3 w-3" />
                                </Badge>
                              )}
                              {time.flag & FLAG_JOIN && (
                                <Badge variant="default" className="px-1.5 py-0 text-xs">
                                  <FastForward className="h-3 w-3" />
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* 메모 */}
                        <TableCell>
                          <span className="text-sm text-muted-foreground truncate max-w-[100px] block">
                            {time.memo || '-'}
                          </span>
                        </TableCell>

                        {/* 조인현황 - status */}
                        <TableCell>
                          <Badge variant={getStatusVariant(time.status)}>{time.status}</Badge>
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => router.push(`/dashboard/reservation/${time.id}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                상세 보기
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/dashboard/course-time/edit/${time.id}`)
                                }
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                수정
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(time.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                삭제
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default withAuth(CourseTimePage)
