import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Badge } from '@/components/ui/badge'
import { DollarSign, TrendingUp, ShoppingCart, Search } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { withAuth } from '@/lib/hooks/useRequireAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

type JoinPersonWithDetails = {
  id: string
  name: string
  phone_number: string
  green_fee: number
  charge_fee: number
  status: string
  created_at: string
  course_times: {
    reserved_time: string
    courses: {
      golf_club_name: string
      course_name: string
    } | null
  } | null
}

function MyPerformancePage({ user, profile }: any) {
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [joinPersons, setJoinPersons] = useState<JoinPersonWithDetails[]>([])
  const [loading, setLoading] = useState(false)

  // 통계 계산
  const stats = {
    totalSales: joinPersons.reduce((sum, jp) => sum + jp.green_fee, 0),
    totalCommission: joinPersons.reduce((sum, jp) => sum + jp.charge_fee, 0),
    totalCount: joinPersons.length,
  }

  const fetchPerformance = async () => {
    if (!user?.id) return

    setLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('join_persons')
        .select(
          `
          id,
          name,
          phone_number,
          green_fee,
          charge_fee,
          status,
          created_at,
          course_times!inner (
            reserved_time,
            courses (
              golf_club_name,
              course_name
            )
          )
        `
        )
        .eq('manager_id', user.id)
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at', { ascending: false })

      if (error) throw error

      setJoinPersons((data as any) || [])
    } catch (error) {
      console.error('Error fetching performance:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPerformance()
  }, [user])

  const getStatusColor = (status: string) => {
    switch (status) {
      case '입금완료':
        return 'default'
      case '입금확인중':
        return 'secondary'
      case '환불완료':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        {/* 헤더 */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">내 실적 조회</h1>
          <p className="text-muted-foreground mt-1">판매 실적과 수수료를 확인합니다</p>
        </div>

        {/* 날짜 필터 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">조회 기간</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="startDate">시작일</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="endDate">종료일</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <Button onClick={fetchPerformance} className="w-full sm:w-auto">
                <Search className="mr-2 h-4 w-4" />
                조회
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 통계 카드 */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 판매액</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalSales.toLocaleString()}원
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                그린피 합계
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 수수료</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.totalCommission.toLocaleString()}원
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                받을 수수료 합계
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">판매 건수</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCount}건</div>
              <p className="text-xs text-muted-foreground mt-1">
                조인 판매 횟수
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 판매 내역 테이블 */}
        <Card>
          <CardHeader>
            <CardTitle>판매 내역</CardTitle>
            <CardDescription>
              {format(new Date(startDate), 'yyyy-MM-dd')} ~{' '}
              {format(new Date(endDate), 'yyyy-MM-dd')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                로딩 중...
              </div>
            ) : joinPersons.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                판매 내역이 없습니다
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>날짜</TableHead>
                      <TableHead>골프장</TableHead>
                      <TableHead>코스</TableHead>
                      <TableHead>고객명</TableHead>
                      <TableHead>전화번호</TableHead>
                      <TableHead className="text-right">그린피</TableHead>
                      <TableHead className="text-right">수수료</TableHead>
                      <TableHead>상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {joinPersons.map((jp) => (
                      <TableRow key={jp.id}>
                        <TableCell className="whitespace-nowrap">
                          {jp.course_times?.reserved_time
                            ? format(
                                new Date(jp.course_times.reserved_time),
                                'MM-dd (E)',
                                { locale: ko }
                              )
                            : '-'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {jp.course_times?.courses?.golf_club_name || '-'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {jp.course_times?.courses?.course_name || '-'}
                        </TableCell>
                        <TableCell>{jp.name}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {jp.phone_number}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {jp.green_fee.toLocaleString()}원
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600 whitespace-nowrap">
                          {jp.charge_fee.toLocaleString()}원
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(jp.status)}>
                            {jp.status}
                          </Badge>
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

export default withAuth(MyPerformancePage)
