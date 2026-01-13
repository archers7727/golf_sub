'use client'

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, TrendingUp, ShoppingCart, Search, Users } from 'lucide-react'
import { format } from 'date-fns'

type ManagerPerformance = {
  manager_id: string
  manager_name: string
  total_sales: number
  total_commission: number
  total_count: number
}

type GolfClubPerformance = {
  golf_club_name: string
  total_sales: number
  total_count: number
}

export default function PerformancePage() {
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [managerPerformances, setManagerPerformances] = useState<ManagerPerformance[]>([])
  const [golfClubPerformances, setGolfClubPerformances] = useState<GolfClubPerformance[]>([])
  const [loading, setLoading] = useState(false)

  // 전체 통계
  const totalStats = {
    sales: managerPerformances.reduce((sum, mp) => sum + mp.total_sales, 0),
    commission: managerPerformances.reduce((sum, mp) => sum + mp.total_commission, 0),
    count: managerPerformances.reduce((sum, mp) => sum + mp.total_count, 0),
  }

  const fetchPerformances = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      // 매니저별 실적
      const { data: joinPersons, error } = await supabase
        .from('join_persons')
        .select(
          `
          manager_id,
          green_fee,
          charge_fee,
          users:manager_id (
            id,
            name
          ),
          course_times (
            courses (
              golf_club_name
            )
          )
        `
        )
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)

      if (error) throw error

      // 매니저별 집계
      const managerMap = new Map<string, ManagerPerformance>()
      const golfClubMap = new Map<string, GolfClubPerformance>()

      joinPersons?.forEach((jp: any) => {
        const managerId = jp.manager_id
        const managerName = jp.users?.name || '알 수 없음'

        if (!managerMap.has(managerId)) {
          managerMap.set(managerId, {
            manager_id: managerId,
            manager_name: managerName,
            total_sales: 0,
            total_commission: 0,
            total_count: 0,
          })
        }

        const managerPerf = managerMap.get(managerId)!
        managerPerf.total_sales += jp.green_fee || 0
        managerPerf.total_commission += jp.charge_fee || 0
        managerPerf.total_count += 1

        // 골프장별 집계
        const golfClubName = jp.course_times?.courses?.golf_club_name || '기타'
        if (!golfClubMap.has(golfClubName)) {
          golfClubMap.set(golfClubName, {
            golf_club_name: golfClubName,
            total_sales: 0,
            total_count: 0,
          })
        }

        const golfClubPerf = golfClubMap.get(golfClubName)!
        golfClubPerf.total_sales += jp.green_fee || 0
        golfClubPerf.total_count += 1
      })

      // Map을 배열로 변환 및 정렬
      const managerArray = Array.from(managerMap.values()).sort(
        (a, b) => b.total_sales - a.total_sales
      )
      const golfClubArray = Array.from(golfClubMap.values()).sort(
        (a, b) => b.total_sales - a.total_sales
      )

      setManagerPerformances(managerArray)
      setGolfClubPerformances(golfClubArray)
    } catch (error) {
      console.error('Error fetching performances:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPerformances()
  }, [])

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">전체 실적 조회</h1>
        <p className="text-muted-foreground mt-1">
          전체 매니저 및 골프장별 실적을 확인합니다
        </p>
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
            <Button onClick={fetchPerformances} className="w-full sm:w-auto">
              <Search className="mr-2 h-4 w-4" />
              조회
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 전체 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 매니저</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {managerPerformances.length}명
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              활동 매니저
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 판매액</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalStats.sales.toLocaleString()}원
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
              {totalStats.commission.toLocaleString()}원
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              수수료 합계
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 판매 건수</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.count}건</div>
            <p className="text-xs text-muted-foreground mt-1">
              조인 판매 횟수
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 탭 */}
      <Tabs defaultValue="manager" className="space-y-4">
        <TabsList>
          <TabsTrigger value="manager">매니저별 실적</TabsTrigger>
          <TabsTrigger value="golfclub">골프장별 실적</TabsTrigger>
        </TabsList>

        <TabsContent value="manager">
          <Card>
            <CardHeader>
              <CardTitle>매니저별 실적</CardTitle>
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
              ) : managerPerformances.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  실적 데이터가 없습니다
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>순위</TableHead>
                        <TableHead>매니저</TableHead>
                        <TableHead className="text-right">판매액</TableHead>
                        <TableHead className="text-right">수수료</TableHead>
                        <TableHead className="text-right">건수</TableHead>
                        <TableHead className="text-right">평균 그린피</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {managerPerformances.map((mp, index) => (
                        <TableRow key={mp.manager_id}>
                          <TableCell className="font-medium">
                            {index + 1}
                          </TableCell>
                          <TableCell>{mp.manager_name}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            {mp.total_sales.toLocaleString()}원
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600 whitespace-nowrap">
                            {mp.total_commission.toLocaleString()}원
                          </TableCell>
                          <TableCell className="text-right">
                            {mp.total_count}건
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            {Math.round(
                              mp.total_sales / mp.total_count
                            ).toLocaleString()}
                            원
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="golfclub">
          <Card>
            <CardHeader>
              <CardTitle>골프장별 실적</CardTitle>
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
              ) : golfClubPerformances.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  실적 데이터가 없습니다
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>순위</TableHead>
                        <TableHead>골프장</TableHead>
                        <TableHead className="text-right">판매액</TableHead>
                        <TableHead className="text-right">건수</TableHead>
                        <TableHead className="text-right">평균 그린피</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {golfClubPerformances.map((gp, index) => (
                        <TableRow key={gp.golf_club_name}>
                          <TableCell className="font-medium">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {gp.golf_club_name}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            {gp.total_sales.toLocaleString()}원
                          </TableCell>
                          <TableCell className="text-right">
                            {gp.total_count}건
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            {Math.round(
                              gp.total_sales / gp.total_count
                            ).toLocaleString()}
                            원
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
