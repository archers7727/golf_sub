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
import { Trash2, UserPlus, Copy } from 'lucide-react'
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

  // 조인 타입별 인원 계산
  const getJoinCount = (joinType: string): number => {
    switch (joinType) {
      case '양도':
        return 4
      case '남남남':
      case '남남여':
      case '남여여':
      case '여여여':
        return 3
      case '남남':
      case '여여':
      case '남여':
        return 2
      case '남':
      case '여':
        return 1
      default:
        return 1
    }
  }

  // 현재 총 조인 인원 계산
  const getTotalJoinCount = (): number => {
    return joinPersons.reduce((total, join) => {
      return total + getJoinCount(join.join_type)
    }, 0)
  }

  const handleAddJoin = async () => {
    if (!joinForm.name || !joinForm.phone_number) {
      toast.error('필수 정보를 입력해주세요')
      return
    }

    if (!timeId || !user) return

    // 추가할 조인의 인원 수 계산
    const newJoinCount = getJoinCount(joinForm.join_type)
    const currentTotal = getTotalJoinCount()

    if (currentTotal + newJoinCount > 4) {
      toast.error('조인 인원 초과', {
        description: `현재 ${currentTotal}명, 추가 시 ${currentTotal + newJoinCount}명이 됩니다.`,
      })
      return
    }

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

      // 새로운 총 인원 계산
      const newTotal = currentTotal + newJoinCount

      // 코스 타임의 join_num 및 status 업데이트
      if (time) {
        let newStatus = time.status
        if (newTotal >= 4) {
          newStatus = '판매완료'
        } else {
          newStatus = '미판매'
        }

        await updateCourseTime(timeId as string, {
          join_num: newTotal,
          status: newStatus,
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

    // 삭제할 조인의 인원 수 계산
    const joinToDelete = joinPersons.find((j) => j.id === joinId)
    if (!joinToDelete) return

    const deleteJoinCount = getJoinCount(joinToDelete.join_type)
    const currentTotal = getTotalJoinCount()

    try {
      await deleteJoinPerson(joinId)

      // 새로운 총 인원 계산
      const newTotal = Math.max(0, currentTotal - deleteJoinCount)

      // 코스 타임의 join_num 및 status 업데이트
      if (time && timeId) {
        let newStatus = time.status
        if (newTotal >= 4) {
          newStatus = '판매완료'
        } else {
          newStatus = '미판매'
        }

        await updateCourseTime(timeId as string, {
          join_num: newTotal,
          status: newStatus,
        })
      }

      toast.success('조인 취소 완료')
      fetchCourseTimes()
    } catch (error: any) {
      toast.error('조인 취소 실패', { description: error.message })
    }
  }

  const handleCopyPhone = (phoneNumber: string) => {
    navigator.clipboard.writeText(phoneNumber)
    toast.success('전화번호가 복사되었습니다', {
      description: phoneNumber,
    })
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

  const handleChangeStatus = async (newStatus: '판매완료' | '미판매' | '타업체마감') => {
    if (!timeId) return

    try {
      await updateCourseTime(timeId as string, { status: newStatus })
      toast.success('상태 변경 완료', {
        description: `${newStatus}로 변경되었습니다.`,
      })
      fetchCourseTimes()
    } catch (error: any) {
      toast.error('상태 변경 실패', { description: error.message })
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
                onClick={() => handleChangeStatus('미판매')}
              >
                마감대기
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleChangeStatus('타업체마감')}
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
            <div className="flex items-center justify-between">
              <CardTitle>작성자 : {time.users?.name || '작성자'}</CardTitle>
              <Badge
                variant={
                  time.status === '판매완료' ? 'default' :
                  time.status === '타업체마감' ? 'destructive' :
                  'secondary'
                }
                className="text-sm"
              >
                {time.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-3 font-medium text-center w-1/5 border-r bg-slate-800 text-white">골프장</td>
                    <td className="px-4 py-3 text-center w-1/5 border-r">{time.courses?.golf_club_name || '-'}</td>
                    <td className="px-4 py-3 font-medium text-center w-1/5 border-r bg-slate-800 text-white">예약일</td>
                    <td className="px-4 py-3 text-center w-2/5">
                      {format(new Date(time.reserved_time), 'MM/dd(E)', { locale: ko })}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-3 font-medium text-center bg-slate-800 text-white border-r">코스</td>
                    <td className="px-4 py-3 text-center border-r">{time.courses?.course_name || '-'}</td>
                    <td className="px-4 py-3 font-medium text-center bg-slate-800 text-white border-r">타임</td>
                    <td className="px-4 py-3 text-center">
                      {format(new Date(time.reserved_time), 'HH:mm', { locale: ko })}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-3 font-medium text-center border-r bg-slate-800 text-white">조건</td>
                    <td className="px-4 py-3 text-center border-r">
                      <Badge variant="outline">{time.requirements}</Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-center border-r bg-slate-800 text-white">예약자명</td>
                    <td className="px-4 py-3 text-center">{time.reserved_name}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-3 font-medium text-center bg-slate-800 text-white border-r">조건없음</td>
                    <td className="px-4 py-3 text-center border-r">{time.reserved_name}</td>
                    <td className="px-4 py-3 font-medium text-center bg-slate-800 text-white border-r">그린피</td>
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
            <CardTitle>조인 현황 ({getTotalJoinCount()}/4)</CardTitle>
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
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">담당자</p>
                      <p className="font-medium">{join.users?.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">조인 성별</p>
                      <p className="text-sm">
                        {join.join_type} ({getJoinCount(join.join_type)}명)
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">이름</p>
                      <p className="text-sm">{join.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">연락처</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm flex-1">{join.phone_number}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleCopyPhone(join.phone_number)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">현장 그린피</p>
                      <p className="text-sm font-medium">{join.green_fee.toLocaleString()}원</p>
                    </div>
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
        {getTotalJoinCount() < 4 && (
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
