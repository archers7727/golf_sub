'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCourseTimeStore } from '@/lib/stores/course-time-store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Plus, Filter, MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'

export default function CourseTimePage() {
  const router = useRouter()
  const { courseTimes, loading, fetchCourseTimes, deleteCourseTime } = useCourseTimeStore()
  const [filters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  })

  useEffect(() => {
    fetchCourseTimes(filters)
  }, [filters, fetchCourseTimes])

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      await deleteCourseTime(id)
      toast.success('삭제 완료', {
        description: '타임이 성공적으로 삭제되었습니다.',
      })
    } catch (error: any) {
      toast.error('삭제 실패', {
        description: error.message,
      })
    }
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">코스 타임 관리</h1>
          <p className="text-muted-foreground mt-1">골프장 예약 타임을 관리합니다</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            필터
          </Button>
          <Button onClick={() => router.push('/dashboard/course-time/register')}>
            <Plus className="mr-2 h-4 w-4" />
            타임 등록
          </Button>
        </div>
      </div>

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
                    <TableHead>예약 일시</TableHead>
                    <TableHead>골프장</TableHead>
                    <TableHead>코스</TableHead>
                    <TableHead>예약자</TableHead>
                    <TableHead>그린피</TableHead>
                    <TableHead>조인</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseTimes.map((time) => (
                    <TableRow key={time.id}>
                      <TableCell className="font-medium">
                        {format(new Date(time.reserved_time), 'yyyy-MM-dd HH:mm', {
                          locale: ko,
                        })}
                      </TableCell>
                      <TableCell>{time.courses?.golf_club_name || '-'}</TableCell>
                      <TableCell>{time.courses?.course_name || '-'}</TableCell>
                      <TableCell>{time.reserved_name}</TableCell>
                      <TableCell>{time.green_fee.toLocaleString()}원</TableCell>
                      <TableCell>
                        <span className="font-semibold">{time.join_num}</span>/4
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(time.status)}>{time.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/dashboard/reservation/detail?id=${time.id}`)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              상세 보기
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/dashboard/course-time/register?id=${time.id}`)
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
  )
}
