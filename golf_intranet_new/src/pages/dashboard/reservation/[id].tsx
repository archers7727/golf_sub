import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useCourseTimeStore } from '@/lib/stores/course-time-store'
import { useJoinPersonStore } from '@/lib/stores/join-person-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Trash2, UserPlus } from 'lucide-react'
import { withAuth } from '@/lib/hooks/useRequireAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

function ReservationDetailPage({ user, profile }: any) {
  const router = useRouter()
  const { id: timeId } = router.query
  const { courseTimes, fetchCourseTimes, deleteCourseTime, updateCourseTime } = useCourseTimeStore()
  const { joinPersons, fetchJoinPersons, createJoinPerson, deleteJoinPerson } = useJoinPersonStore()

  const [joinForm, setJoinForm] = useState({
    name: '',
    phone_number: '',
    join_type: '남',
    green_fee: 0,
  })
  const [greenFeeInput, setGreenFeeInput] = useState('')

  const time = courseTimes.find((t) => t.id === timeId)

  useEffect(() => {
    if (timeId) {
      fetchCourseTimes()
      fetchJoinPersons(timeId as string)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeId])

  useEffect(() => {
    if (time) {
      setJoinForm((prev) => ({ ...prev, green_fee: time.green_fee }))
      setGreenFeeInput(time.green_fee.toLocaleString())
    }
  }, [time])

  const handleAddJoin = async () => {
    if (!joinForm.name || !joinForm.phone_number) {
      toast.error('필수 정보를 입력해주세요')
      return
    }

    if (!timeId || !user) return

    try {
      await createJoinPerson({
        manager_id: user.id,
        time_id: timeId as string,
        name: joinForm.name,
        phone_number: joinForm.phone_number,
        join_type: joinForm.join_type as any,
        join_num: 1,
        green_fee: joinForm.green_fee,
        charge_fee: time?.charge_fee || 0,
      })

      // 코스 타임의 join_num 업데이트
      if (time) {
        await updateCourseTime(timeId as string, {
          join_num: time.join_num + 1,
          status: time.join_num + 1 >= 4 ? '판매완료' : time.status,
        })
      }

      toast.success('조인 추가 완료')
      setJoinForm({ name: '', phone_number: '', join_type: '남', green_fee: time?.green_fee || 0 })
      setGreenFeeInput((time?.green_fee || 0).toLocaleString())
      fetchCourseTimes()
    } catch (error: any) {
      toast.error('조인 추가 실패', { description: error.message })
    }
  }

  const handleRemoveJoin = async (joinId: string) => {
    if (!confirm('조인을 취소하시겠습니까?')) return

    try {
      await deleteJoinPerson(joinId)

      // 코스 타임의 join_num 업데이트
      if (time && timeId) {
        await updateCourseTime(timeId as string, {
          join_num: Math.max(0, time.join_num - 1),
          status: time.join_num - 1 < 4 ? '미판매' : time.status,
        })
      }

      toast.success('조인 취소 완료')
      fetchCourseTimes()
    } catch (error: any) {
      toast.error('조인 취소 실패', { description: error.message })
    }
  }

  const handleDeleteTime = async () => {
    if (!confirm('타임을 삭제하시겠습니까?')) return
    if (!timeId) return

    try {
      await deleteCourseTime(timeId as string)
      toast.success('타임 삭제 완료')
      router.push('/dashboard/course-time')
    } catch (error: any) {
      toast.error('삭제 실패', { description: error.message })
    }
  }

  if (!time) {
    return (
      <DashboardLayout profile={profile}>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">타임을 찾을 수 없습니다</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">판매 페이지</h1>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDeleteTime}
              >
                삭제하기
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/dashboard/course-time/edit/${timeId}`)}
              >
                마감대기
              </Button>
              <Button
                size="sm"
                variant="outline"
              >
                타업체마감
              </Button>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            돌아가기
          </Button>
        </div>

        {/* 타임 정보 - 테이블 형태 */}
        <Card>
          <CardHeader>
            <CardTitle>작성자 : {time.users?.name || '작성자'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <tbody>
                  <tr className="border-b bg-slate-50">
                    <td className="px-4 py-3 font-medium text-center w-1/5 border-r">골프장</td>
                    <td className="px-4 py-3 text-center w-1/5 border-r">{time.courses?.golf_club_name || '-'}</td>
                    <td className="px-4 py-3 font-medium text-center w-1/5 border-r">예약일</td>
                    <td className="px-4 py-3 text-center w-2/5">
                      {format(new Date(time.reserved_time), 'MM/dd(E)', { locale: ko })}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-3 font-medium text-center bg-slate-50 border-r">코스</td>
                    <td className="px-4 py-3 text-center border-r">{time.courses?.course_name || '-'}</td>
                    <td className="px-4 py-3 font-medium text-center bg-slate-50 border-r">타임</td>
                    <td className="px-4 py-3 text-center">
                      {format(new Date(time.reserved_time), 'HH:mm', { locale: ko })}
                    </td>
                  </tr>
                  <tr className="border-b bg-slate-50">
                    <td className="px-4 py-3 font-medium text-center border-r">조건</td>
                    <td className="px-4 py-3 text-center border-r">
                      <Badge variant="outline">{time.requirements}</Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-center border-r">예약자명</td>
                    <td className="px-4 py-3 text-center">{time.reserved_name}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-3 font-medium text-center bg-slate-50 border-r">조건없음</td>
                    <td className="px-4 py-3 text-center border-r">{time.reserved_name}</td>
                    <td className="px-4 py-3 font-medium text-center bg-slate-50 border-r">그린피</td>
                    <td className="px-4 py-3 text-center">{Math.floor(time.green_fee / 10000)}+{Math.floor(time.charge_fee / 10000)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {time.memo && (
              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <span className="font-medium">메모</span>
                <p className="text-sm mt-1">{time.memo}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 조인 현황 */}
        <Card>
          <CardHeader>
            <CardTitle>조인 현황 ({time.join_num}/4)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {joinPersons.slice(0, 4).map((join, index) => (
                <div key={join.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="default">{index + 1}번</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive"
                      onClick={() => handleRemoveJoin(join.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">{join.name}</p>
                    <p className="text-sm text-muted-foreground">{join.join_type}</p>
                    <p className="text-sm text-muted-foreground">{join.phone_number}</p>
                    <p className="text-sm font-medium">{join.green_fee.toLocaleString()}원</p>
                    <Badge variant="secondary" className="text-xs">
                      {join.status}
                    </Badge>
                  </div>
                </div>
              ))}

              {/* 빈 자리 */}
              {Array.from({ length: 4 - joinPersons.length }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="border border-dashed rounded-lg p-4 flex items-center justify-center text-muted-foreground"
                >
                  빈 자리
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 조인 추가 */}
        {time.join_num < 4 && (
          <Card>
            <CardHeader>
              <CardTitle>
                <UserPlus className="inline mr-2 h-5 w-5" />
                조인 추가
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>이름</Label>
                  <Input
                    value={joinForm.name}
                    onChange={(e) => setJoinForm({ ...joinForm, name: e.target.value })}
                    placeholder="홍길동"
                  />
                </div>
                <div className="space-y-2">
                  <Label>전화번호</Label>
                  <Input
                    value={joinForm.phone_number}
                    onChange={(e) => setJoinForm({ ...joinForm, phone_number: e.target.value })}
                    placeholder="01012345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label>조인 성별</Label>
                  <Select
                    value={joinForm.join_type}
                    onValueChange={(value) => setJoinForm({ ...joinForm, join_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="양도">양도</SelectItem>
                      <SelectItem value="남여">남여</SelectItem>
                      <SelectItem value="남">남</SelectItem>
                      <SelectItem value="여">여</SelectItem>
                      <SelectItem value="남남">남남</SelectItem>
                      <SelectItem value="여여">여여</SelectItem>
                      <SelectItem value="남남남">남남남</SelectItem>
                      <SelectItem value="남남여">남남여</SelectItem>
                      <SelectItem value="남여여">남여여</SelectItem>
                      <SelectItem value="여여여">여여여</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>현장 그린피</Label>
                  <Input
                    type="text"
                    value={greenFeeInput}
                    onChange={(e) => {
                      const value = e.target.value.replace(/,/g, '')
                      if (/^\d*$/.test(value)) {
                        const numValue = parseInt(value) || 0
                        setJoinForm({ ...joinForm, green_fee: numValue })
                        setGreenFeeInput(numValue.toLocaleString())
                      }
                    }}
                    placeholder="100000"
                  />
                </div>
              </div>
              <Button className="w-full mt-4" onClick={handleAddJoin}>
                <UserPlus className="mr-2 h-4 w-4" />
                조인 추가
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

export default withAuth(ReservationDetailPage)
