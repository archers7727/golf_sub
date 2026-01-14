// @ts-nocheck
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Clock, DollarSign, FastForward } from 'lucide-react'
import { toast } from 'sonner'
import { withAuth } from '@/lib/hooks/useRequireAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

const REGIONS = ['경기북부', '경기남부', '충청도', '경상남도', '강원도']
const REQUIREMENTS = ['조건없음', '인회필', '예변필', '인회필/예변필']

// Flag 비트마스크
const FLAG_URGENT = 1  // 임박
const FLAG_COST = 2    // 원가
const FLAG_JOIN = 4    // 조인

type GolfClub = {
  id: string
  name: string
  region: string
}

type Course = {
  id: string
  course_name: string
  golf_club_name: string
}

function RegisterCourseTimePage({ user, profile }: any) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Debug logging
  useEffect(() => {
    console.log('RegisterCourseTimePage mounted', { user, profile })
  }, [user, profile])

  // Form state
  const [region, setRegion] = useState('')
  const [golfClubId, setGolfClubId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [reservedDate, setReservedDate] = useState('')
  const [reservedTime, setReservedTime] = useState('')
  const [greenFee, setGreenFee] = useState('')
  const [reservedName, setReservedName] = useState('')
  const [requirements, setRequirements] = useState('조건없음')
  const [memo, setMemo] = useState('')
  const [flags, setFlags] = useState(0)

  // Data
  const [golfClubs, setGolfClubs] = useState<GolfClub[]>([])
  const [courses, setCourses] = useState<Course[]>([])

  // Load golf clubs when region changes
  useEffect(() => {
    if (!region) {
      setGolfClubs([])
      setGolfClubId('')
      return
    }

    const fetchGolfClubs = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('golf_clubs')
        .select('id, name, region')
        .eq('region', region)
        .eq('hidden', false)
        .is('deleted_at', null)
        .order('name')

      if (error) {
        console.error('Error fetching golf clubs:', error)
        toast.error('골프장 목록을 불러올 수 없습니다')
        return
      }

      setGolfClubs(data || [])
    }

    fetchGolfClubs()
  }, [region])

  // Load courses when golf club changes
  useEffect(() => {
    if (!golfClubId) {
      setCourses([])
      setCourseId('')
      return
    }

    const fetchCourses = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('courses')
        .select('id, course_name, golf_club_name')
        .eq('club_id', golfClubId)
        .is('deleted_at', null)
        .order('course_name')

      if (error) {
        console.error('Error fetching courses:', error)
        toast.error('코스 목록을 불러올 수 없습니다')
        return
      }

      setCourses(data || [])
    }

    fetchCourses()
  }, [golfClubId])

  const toggleFlag = (flag: number) => {
    setFlags(prev => prev ^ flag)
  }

  // 시간 입력 자동 포맷 (1228 → 12:28)
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, '') // 숫자만 허용

    if (value.length >= 4) {
      // 4자리 이상이면 HH:MM 형식으로 변환
      const hours = value.slice(0, 2)
      const minutes = value.slice(2, 4)
      value = `${hours}:${minutes}`
    }

    setReservedTime(value)
  }

  // 그린피 입력 처리 (7+1 형식)
  const handleGreenFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // 숫자와 + 기호만 허용
    if (/^[0-9+]*$/.test(value)) {
      setGreenFee(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!region || !golfClubId || !courseId || !reservedDate || !reservedTime || !greenFee || !reservedName) {
      toast.error('필수 항목을 모두 입력해주세요')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // 시간 파싱 (12:28 또는 1228 형식 모두 처리)
      let timeStr = reservedTime
      if (!timeStr.includes(':')) {
        // 콜론이 없으면 추가
        if (timeStr.length === 4) {
          timeStr = `${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}`
        }
      }

      // Combine date and time
      const reservedDateTime = `${reservedDate}T${timeStr}:00`

      // 그린피 파싱 (7+1 형식)
      const feeParts = greenFee.split('+')
      let greenFeeValue = 0
      let chargeFeeValue = 0

      if (feeParts.length === 2) {
        // "7+1" 형식 - 만원 단위를 원으로 변환
        greenFeeValue = parseInt(feeParts[0]) * 10000
        chargeFeeValue = parseInt(feeParts[1]) * 10000
      } else if (feeParts.length === 1 && feeParts[0]) {
        // "7" 형식 - 그린피만 입력
        greenFeeValue = parseInt(feeParts[0]) * 10000
        chargeFeeValue = 0
      } else {
        toast.error('그린피 형식이 올바르지 않습니다 (예: 7+1)')
        setLoading(false)
        return
      }

      const { error } = await supabase.from('course_times').insert({
        author_id: user.id,
        course_id: courseId,
        reserved_time: reservedDateTime,
        reserved_name: reservedName,
        green_fee: greenFeeValue,
        charge_fee: chargeFeeValue,
        requirements: requirements,
        flag: flags,
        memo: memo || null,
        status: '미판매',
        join_num: 0,
      })

      if (error) throw error

      toast.success('타임이 등록되었습니다')
      router.push('/dashboard/course-time')
    } catch (error: any) {
      console.error('Error creating course time:', error)
      toast.error('등록 실패', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout profile={profile}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">타임작성</h1>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>작성자</CardTitle>
              <div className="flex gap-2">
                <Badge
                  variant={flags & FLAG_URGENT ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleFlag(FLAG_URGENT)}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  임박
                </Badge>
                <Badge
                  variant={flags & FLAG_COST ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleFlag(FLAG_COST)}
                >
                  <DollarSign className="h-3 w-3 mr-1" />
                  원가
                </Badge>
                <Badge
                  variant={flags & FLAG_JOIN ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleFlag(FLAG_JOIN)}
                >
                  <FastForward className="h-3 w-3 mr-1" />
                  조인
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-3 rounded-md mb-6">
              <p className="text-sm font-medium">{profile?.name || '사용자'}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="region">지역 *</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger>
                      <SelectValue placeholder="지역 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="golfClub">골프장 *</Label>
                  <Select value={golfClubId} onValueChange={setGolfClubId} disabled={!region}>
                    <SelectTrigger>
                      <SelectValue placeholder="골프장 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {golfClubs.map((club) => (
                        <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reservedDate">예약일 *</Label>
                  <Input
                    id="reservedDate"
                    type="date"
                    value={reservedDate}
                    onChange={(e) => setReservedDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course">코스 *</Label>
                  <Select value={courseId} onValueChange={setCourseId} disabled={!golfClubId}>
                    <SelectTrigger>
                      <SelectValue placeholder="코스 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>{course.course_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reservedTime">시+분 *</Label>
                  <Input
                    id="reservedTime"
                    type="text"
                    value={reservedTime}
                    onChange={handleTimeChange}
                    placeholder="1228 또는 12:28"
                    maxLength={5}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="greenFee">그린피 *</Label>
                  <Input
                    id="greenFee"
                    type="text"
                    value={greenFee}
                    onChange={handleGreenFeeChange}
                    placeholder="7+1 (만원 단위)"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reservedName">예약자명 *</Label>
                  <Input
                    id="reservedName"
                    value={reservedName}
                    onChange={(e) => setReservedName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements">조건</Label>
                  <Select value={requirements} onValueChange={setRequirements}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REQUIREMENTS.map((req) => (
                        <SelectItem key={req} value={req}>{req}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="memo">메모</Label>
                <Textarea
                  id="memo"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="메모를 입력하세요."
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? '생성하기...' : '생성하기'}
                </Button>
                <Button
                  type="submit"
                  variant="outline"
                  disabled={loading}
                  onClick={(e) => {
                    // Keep form data and submit again
                  }}
                >
                  추가생성
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

export default withAuth(RegisterCourseTimePage)
