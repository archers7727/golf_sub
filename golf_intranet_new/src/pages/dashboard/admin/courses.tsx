// @ts-nocheck
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { withAuth } from '@/lib/hooks/useRequireAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

const REGIONS = ['경기북부', '경기남부', '충청도', '경상남도', '강원도'] as const
type Region = (typeof REGIONS)[number]

type Course = {
  id: string
  club_id: string | null
  region: Region
  golf_club_name: string
  course_name: string
}

type GolfClub = {
  id: string
  region: Region
  name: string
  cancel_deadline_date: number
  cancel_deadline_hour: number
}

type MainTab = 'courses' | 'cancel-deadline'

function ManageCoursesPage({ profile }: any) {
  const [mainTab, setMainTab] = useState<MainTab>('courses')
  const [selectedRegion, setSelectedRegion] = useState<Region>('경기북부')

  // 골프장 관리 상태
  const [courses, setCourses] = useState<Course[]>([])
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [formData, setFormData] = useState({
    region: '경기북부' as Region,
    golf_club_name: '',
    course_name: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // 취소기한 관리 상태
  const [golfClubs, setGolfClubs] = useState<GolfClub[]>([])
  const [clubsLoading, setClubsLoading] = useState(false)
  const [deadlineChanges, setDeadlineChanges] = useState<Record<string, { date: number; hour: number }>>({})
  const [savingDeadline, setSavingDeadline] = useState(false)

  // 코스 목록 조회
  const fetchCourses = async () => {
    setCoursesLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('region', selectedRegion)
        .is('deleted_at', null)
        .order('golf_club_name')
        .order('course_name')

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast.error('코스 목록을 불러오지 못했습니다')
    } finally {
      setCoursesLoading(false)
    }
  }

  // 골프장 목록 조회 (취소기한 관리용)
  const fetchGolfClubs = async () => {
    setClubsLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('golf_clubs')
        .select('id, region, name, cancel_deadline_date, cancel_deadline_hour')
        .eq('region', selectedRegion)
        .is('deleted_at', null)
        .order('name')

      if (error) throw error
      setGolfClubs(data || [])
      setDeadlineChanges({})
    } catch (error) {
      console.error('Error fetching golf clubs:', error)
      toast.error('골프장 목록을 불러오지 못했습니다')
    } finally {
      setClubsLoading(false)
    }
  }

  useEffect(() => {
    if (mainTab === 'courses') {
      fetchCourses()
    } else {
      fetchGolfClubs()
    }
  }, [mainTab, selectedRegion])

  // 골프장/코스 추가/수정 다이얼로그 열기
  const handleOpenDialog = (course?: Course) => {
    if (course) {
      setEditingCourse(course)
      setFormData({
        region: course.region,
        golf_club_name: course.golf_club_name,
        course_name: course.course_name,
      })
    } else {
      setEditingCourse(null)
      setFormData({
        region: selectedRegion,
        golf_club_name: '',
        course_name: '',
      })
    }
    setDialogOpen(true)
  }

  // 골프장/코스 저장
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()

    if (!formData.golf_club_name.trim() || !formData.course_name.trim()) {
      toast.error('모든 필드를 입력해주세요')
      return
    }

    setSubmitting(true)

    try {
      // 1. 골프장(golf_clubs)이 존재하는지 확인
      const { data: existingClub } = await supabase
        .from('golf_clubs')
        .select('id')
        .eq('name', formData.golf_club_name.trim())
        .eq('region', formData.region)
        .is('deleted_at', null)
        .single()

      let clubId = existingClub?.id

      // 2. 골프장이 없으면 새로 생성
      if (!clubId) {
        const { data: newClub, error: clubError } = await supabase
          .from('golf_clubs')
          .insert({
            region: formData.region,
            name: formData.golf_club_name.trim(),
            cancel_deadline_date: 1,
            cancel_deadline_hour: 18,
          })
          .select('id')
          .single()

        if (clubError) throw clubError
        clubId = newClub.id
      }

      // 3. 코스 추가/수정
      if (editingCourse) {
        // 수정 시 기존 골프장 이름이 변경되었는지 확인
        const { error } = await supabase
          .from('courses')
          .update({
            club_id: clubId,
            region: formData.region,
            golf_club_name: formData.golf_club_name.trim(),
            course_name: formData.course_name.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCourse.id)

        if (error) throw error
        toast.success('골프장이 수정되었습니다')
      } else {
        const { error } = await supabase.from('courses').insert({
          club_id: clubId,
          region: formData.region,
          golf_club_name: formData.golf_club_name.trim(),
          course_name: formData.course_name.trim(),
        })

        if (error) throw error
        toast.success('골프장이 추가되었습니다')
      }

      setDialogOpen(false)
      fetchCourses()
    } catch (error: any) {
      console.error('Error saving course:', error)
      toast.error(error.message || '저장에 실패했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  // 코스 삭제
  const handleDelete = async (course: Course) => {
    if (!confirm(`${course.golf_club_name} - ${course.course_name}을(를) 삭제하시겠습니까?`)) return

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('courses')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', course.id)

      if (error) throw error
      toast.success('골프장이 삭제되었습니다')
      fetchCourses()
    } catch (error) {
      console.error('Error deleting course:', error)
      toast.error('삭제에 실패했습니다')
    }
  }

  // 취소기한 변경
  const handleDeadlineChange = (clubId: string, field: 'date' | 'hour', value: number) => {
    const club = golfClubs.find(c => c.id === clubId)
    if (!club) return

    setDeadlineChanges(prev => ({
      ...prev,
      [clubId]: {
        date: field === 'date' ? value : (prev[clubId]?.date ?? club.cancel_deadline_date),
        hour: field === 'hour' ? value : (prev[clubId]?.hour ?? club.cancel_deadline_hour),
      }
    }))
  }

  // 취소기한 저장
  const handleSaveDeadlines = async () => {
    const supabase = createClient()
    const changeEntries = Object.entries(deadlineChanges)

    if (changeEntries.length === 0) {
      toast.info('변경된 내용이 없습니다')
      return
    }

    setSavingDeadline(true)

    try {
      for (const [clubId, changes] of changeEntries) {
        const { error } = await supabase
          .from('golf_clubs')
          .update({
            cancel_deadline_date: changes.date,
            cancel_deadline_hour: changes.hour,
            updated_at: new Date().toISOString(),
          })
          .eq('id', clubId)

        if (error) throw error
      }

      toast.success('취소기한이 저장되었습니다')
      fetchGolfClubs()
    } catch (error) {
      console.error('Error saving deadlines:', error)
      toast.error('저장에 실패했습니다')
    } finally {
      setSavingDeadline(false)
    }
  }

  const getDeadlineValue = (club: GolfClub, field: 'date' | 'hour') => {
    if (deadlineChanges[club.id]) {
      return field === 'date' ? deadlineChanges[club.id].date : deadlineChanges[club.id].hour
    }
    return field === 'date' ? club.cancel_deadline_date : club.cancel_deadline_hour
  }

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">골프장 관리</h1>
          <p className="text-muted-foreground mt-1">
            골프장과 코스를 관리합니다
          </p>
        </div>

        {/* 메인 탭 */}
        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTab)}>
          <TabsList>
            <TabsTrigger value="courses">골프장 관리</TabsTrigger>
            <TabsTrigger value="cancel-deadline">취소기한 관리</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 지역 탭 */}
        <div className="flex gap-2">
          {REGIONS.map((region) => (
            <Button
              key={region}
              variant={selectedRegion === region ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRegion(region)}
            >
              {region}
            </Button>
          ))}
        </div>

        {/* 골프장 관리 탭 내용 */}
        {mainTab === 'courses' && (
          <div className="bg-white rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-600 hover:bg-blue-600">
                  <TableHead className="text-white font-medium">골프장 이름</TableHead>
                  <TableHead className="text-white font-medium">코스이름</TableHead>
                  <TableHead className="text-white font-medium w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coursesLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      로딩 중...
                    </TableCell>
                  </TableRow>
                ) : courses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      등록된 골프장이 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  courses.map((course) => (
                    <TableRow
                      key={course.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleOpenDialog(course)}
                    >
                      <TableCell className="font-medium">{course.golf_club_name}</TableCell>
                      <TableCell>{course.course_name}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(course)
                          }}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <div className="p-4 flex justify-end border-t">
              <Button onClick={() => handleOpenDialog()}>
                골프장 추가
              </Button>
            </div>
          </div>
        )}

        {/* 취소기한 관리 탭 내용 */}
        {mainTab === 'cancel-deadline' && (
          <div className="bg-white rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-600 hover:bg-blue-600">
                  <TableHead className="text-white font-medium">골프장 이름</TableHead>
                  <TableHead className="text-white font-medium text-center">취소기한</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clubsLoading ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8">
                      로딩 중...
                    </TableCell>
                  </TableRow>
                ) : golfClubs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                      등록된 골프장이 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  golfClubs.map((club) => (
                    <TableRow key={club.id}>
                      <TableCell className="font-medium">{club.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            className="w-16 text-center"
                            value={getDeadlineValue(club, 'date')}
                            onChange={(e) => handleDeadlineChange(club.id, 'date', parseInt(e.target.value) || 0)}
                          />
                          <span>일</span>
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            className="w-16 text-center"
                            value={getDeadlineValue(club, 'hour')}
                            onChange={(e) => handleDeadlineChange(club.id, 'hour', parseInt(e.target.value) || 0)}
                          />
                          <span>시 전</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <div className="p-4 flex justify-end border-t">
              <Button onClick={handleSaveDeadlines} disabled={savingDeadline}>
                {savingDeadline ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        )}

        {/* 골프장 추가/수정 다이얼로그 */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingCourse ? '골프장 수정' : '골프장 추가'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>지역 <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.region}
                    onValueChange={(value) =>
                      setFormData({ ...formData, region: value as Region })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="지역 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>이름 <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.golf_club_name}
                    onChange={(e) =>
                      setFormData({ ...formData, golf_club_name: e.target.value })
                    }
                    placeholder="골프장 이름"
                  />
                </div>
                <div className="space-y-2">
                  <Label>코스 <span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.course_name}
                    onChange={(e) =>
                      setFormData({ ...formData, course_name: e.target.value })
                    }
                    placeholder="코스 이름"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  닫기
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? '저장 중...'
                    : editingCourse
                      ? '수정하기'
                      : '추가하기'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

export default withAuth(ManageCoursesPage, { requireAdmin: true })
