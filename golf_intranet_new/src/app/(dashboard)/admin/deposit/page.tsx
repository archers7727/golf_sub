'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'

type JoinPersonWithDetails = {
  id: string
  name: string
  phone_number: string
  join_type: string
  green_fee: number
  charge_fee: number
  status: string
  created_at: string
  users?: {
    name: string
  } | null
  course_times?: {
    reserved_time: string
    reserved_name: string
    courses: {
      golf_club_name: string
      course_name: string
    } | null
  } | null
}

export default function DepositPage() {
  const [pendingDeposits, setPendingDeposits] = useState<JoinPersonWithDetails[]>([])
  const [pendingRefunds, setPendingRefunds] = useState<JoinPersonWithDetails[]>([])
  const [completedDeposits, setCompletedDeposits] = useState<JoinPersonWithDetails[]>([])
  const [loading, setLoading] = useState(false)

  const fetchDeposits = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      // 입금 대기 (입금확인전, 입금확인중)
      const { data: pending, error: pendingError } = await supabase
        .from('join_persons')
        .select(
          `
          *,
          users:manager_id (name),
          course_times (
            reserved_time,
            reserved_name,
            courses (
              golf_club_name,
              course_name
            )
          )
        `
        )
        .in('status', ['입금확인전', '입금확인중'])
        .order('created_at', { ascending: false })

      if (pendingError) throw pendingError

      // 환불 대기 (환불확인중)
      const { data: refunds, error: refundsError } = await supabase
        .from('join_persons')
        .select(
          `
          *,
          users:manager_id (name),
          course_times (
            reserved_time,
            reserved_name,
            courses (
              golf_club_name,
              course_name
            )
          )
        `
        )
        .eq('status', '환불확인중')
        .order('created_at', { ascending: false })

      if (refundsError) throw refundsError

      // 최근 완료 내역 (입금완료, 환불완료)
      const { data: completed, error: completedError } = await supabase
        .from('join_persons')
        .select(
          `
          *,
          users:manager_id (name),
          course_times (
            reserved_time,
            reserved_name,
            courses (
              golf_club_name,
              course_name
            )
          )
        `
        )
        .in('status', ['입금완료', '환불완료'])
        .order('updated_at', { ascending: false })
        .limit(50)

      if (completedError) throw completedError

      setPendingDeposits((pending as any) || [])
      setPendingRefunds((refunds as any) || [])
      setCompletedDeposits((completed as any) || [])
    } catch (error) {
      console.error('Error fetching deposits:', error)
      toast.error('데이터를 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeposits()
  }, [])

  const updateStatus = async (
    id: string,
    newStatus: string,
    personName: string
  ) => {
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('join_persons')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      toast.success(`${personName}님의 상태가 "${newStatus}"로 변경되었습니다`)
      fetchDeposits()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('상태 변경에 실패했습니다')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case '입금완료':
        return 'default'
      case '입금확인중':
        return 'secondary'
      case '환불완료':
        return 'destructive'
      case '환불확인중':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const renderTable = (data: JoinPersonWithDetails[], showActions: boolean = true) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>날짜</TableHead>
            <TableHead>골프장</TableHead>
            <TableHead>예약자</TableHead>
            <TableHead>조인고객</TableHead>
            <TableHead>전화번호</TableHead>
            <TableHead className="text-right">그린피</TableHead>
            <TableHead className="text-right">수수료</TableHead>
            <TableHead>담당자</TableHead>
            <TableHead>상태</TableHead>
            {showActions && <TableHead className="text-right">작업</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showActions ? 10 : 9} className="text-center text-muted-foreground h-32">
                데이터가 없습니다
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="whitespace-nowrap">
                  {item.course_times?.reserved_time
                    ? format(
                        new Date(item.course_times.reserved_time),
                        'MM-dd (E)',
                        { locale: ko }
                      )
                    : '-'}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {item.course_times?.courses?.golf_club_name || '-'}
                </TableCell>
                <TableCell>{item.course_times?.reserved_name || '-'}</TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {item.phone_number}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {item.green_fee.toLocaleString()}원
                </TableCell>
                <TableCell className="text-right font-semibold text-green-600 whitespace-nowrap">
                  {item.charge_fee.toLocaleString()}원
                </TableCell>
                <TableCell>{item.users?.name || '-'}</TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {(item.status === '입금확인전' ||
                        item.status === '입금확인중') && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() =>
                              updateStatus(item.id, '입금완료', item.name)
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            승인
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateStatus(item.id, '입금확인전', item.name)
                            }
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            대기
                          </Button>
                        </>
                      )}
                      {item.status === '환불확인중' && (
                        <>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              updateStatus(item.id, '환불완료', item.name)
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            환불완료
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateStatus(item.id, '입금완료', item.name)
                            }
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            거부
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">입금 관리</h1>
          <p className="text-muted-foreground mt-1">
            조인 예약의 입금 및 환불 상태를 관리합니다
          </p>
        </div>
        <Button onClick={fetchDeposits} variant="outline">
          새로고침
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">입금 대기</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingDeposits.length}건</div>
            <p className="text-xs text-muted-foreground mt-1">
              처리 필요
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">환불 대기</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {pendingRefunds.length}건
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              환불 처리 필요
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최근 완료</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {completedDeposits.length}건
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              최근 50건
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 탭 */}
      <Tabs defaultValue="deposit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="deposit">
            입금 대기 ({pendingDeposits.length})
          </TabsTrigger>
          <TabsTrigger value="refund">
            환불 대기 ({pendingRefunds.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            완료 내역 ({completedDeposits.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deposit">
          <Card>
            <CardHeader>
              <CardTitle>입금 대기 목록</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  로딩 중...
                </div>
              ) : (
                renderTable(pendingDeposits)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refund">
          <Card>
            <CardHeader>
              <CardTitle>환불 대기 목록</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  로딩 중...
                </div>
              ) : (
                renderTable(pendingRefunds)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>완료 내역 (최근 50건)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  로딩 중...
                </div>
              ) : (
                renderTable(completedDeposits, false)
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
