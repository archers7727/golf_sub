// @ts-nocheck
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Shield, Plus, Edit, Trash2, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { withAuth } from '@/lib/hooks/useRequireAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

type GolfClub = {
  id: string
  name: string
  region: string
}

type SiteId = {
  id: string
  site_id: string
  name: string
  golf_club_id: string
  disabled: boolean
  hidden: boolean
  golf_clubs?: {
    name: string
    region: string
  } | null
}

function ManageSiteIdsPage({ profile }: any) {
  const [siteIds, setSiteIds] = useState<SiteId[]>([])
  const [golfClubs, setGolfClubs] = useState<GolfClub[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSiteId, setEditingSiteId] = useState<SiteId | null>(null)
  const [formData, setFormData] = useState({
    site_id: '',
    name: '',
    golf_club_id: '',
    disabled: false,
    hidden: false,
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchSiteIds = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('site_ids')
        .select(
          `
          *,
          golf_clubs (
            name,
            region
          )
        `
        )
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      setSiteIds((data as any) || [])
    } catch (error) {
      console.error('Error fetching site IDs:', error)
      toast.error('사이트ID 목록을 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }

  const fetchGolfClubs = async () => {
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('golf_clubs')
        .select('id, name, region')
        .is('deleted_at', null)
        .order('name')

      if (error) throw error

      setGolfClubs(data || [])
    } catch (error) {
      console.error('Error fetching golf clubs:', error)
    }
  }

  useEffect(() => {
    fetchSiteIds()
    fetchGolfClubs()
  }, [])

  const handleOpenDialog = (siteId?: SiteId) => {
    if (siteId) {
      setEditingSiteId(siteId)
      setFormData({
        site_id: siteId.site_id,
        name: siteId.name,
        golf_club_id: siteId.golf_club_id,
        disabled: siteId.disabled,
        hidden: siteId.hidden,
      })
    } else {
      setEditingSiteId(null)
      setFormData({
        site_id: '',
        name: '',
        golf_club_id: '',
        disabled: false,
        hidden: false,
      })
    }
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()

    if (!formData.site_id || !formData.name || !formData.golf_club_id) {
      toast.error('모든 필드를 입력해주세요')
      return
    }

    setSubmitting(true)

    try {
      if (editingSiteId) {
        const { error } = await supabase
          .from('site_ids')
          .update({
            site_id: formData.site_id,
            name: formData.name,
            golf_club_id: formData.golf_club_id,
            disabled: formData.disabled,
            hidden: formData.hidden,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingSiteId.id)

        if (error) throw error
        toast.success('사이트ID가 수정되었습니다')
      } else {
        const { error } = await supabase.from('site_ids').insert({
          site_id: formData.site_id,
          name: formData.name,
          golf_club_id: formData.golf_club_id,
          disabled: formData.disabled,
          hidden: formData.hidden,
        })

        if (error) throw error
        toast.success('사이트ID가 추가되었습니다')
      }

      setDialogOpen(false)
      fetchSiteIds()
    } catch (error: any) {
      console.error('Error saving site ID:', error)
      toast.error(error.message || '저장에 실패했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (siteId: SiteId) => {
    if (!confirm(`${siteId.name}을(를) 삭제하시겠습니까?`)) return

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('site_ids')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', siteId.id)

      if (error) throw error
      toast.success('사이트ID가 삭제되었습니다')
      fetchSiteIds()
    } catch (error) {
      console.error('Error deleting site ID:', error)
      toast.error('삭제에 실패했습니다')
    }
  }

  const toggleStatus = async (siteId: SiteId, field: 'disabled' | 'hidden') => {
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('site_ids')
        .update({
          [field]: !siteId[field],
          updated_at: new Date().toISOString(),
        })
        .eq('id', siteId.id)

      if (error) throw error
      toast.success('상태가 변경되었습니다')
      fetchSiteIds()
    } catch (error) {
      console.error('Error toggling status:', error)
      toast.error('상태 변경에 실패했습니다')
    }
  }

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">사이트ID 관리</h1>
            <p className="text-muted-foreground mt-1">
              골프장별 사이트ID를 관리합니다
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                사이트ID 추가
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingSiteId ? '사이트ID 수정' : '사이트ID 추가'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingSiteId
                      ? '사이트ID 정보를 수정합니다'
                      : '새로운 사이트ID를 추가합니다'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="golf_club">골프장 *</Label>
                    <Select
                      value={formData.golf_club_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, golf_club_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="골프장 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {golfClubs.map((club) => (
                          <SelectItem key={club.id} value={club.id}>
                            {club.name} ({club.region})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site_id">사이트ID *</Label>
                    <Input
                      id="site_id"
                      value={formData.site_id}
                      onChange={(e) =>
                        setFormData({ ...formData, site_id: e.target.value })
                      }
                      placeholder="예: GOLF001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">이름 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="예: 홍길동"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="disabled"
                        checked={formData.disabled}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, disabled: checked as boolean })
                        }
                      />
                      <Label htmlFor="disabled" className="cursor-pointer">
                        비활성화 (사용 불가)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hidden"
                        checked={formData.hidden}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, hidden: checked as boolean })
                        }
                      />
                      <Label htmlFor="hidden" className="cursor-pointer">
                        숨김 (목록에서 제외)
                      </Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    취소
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting
                      ? '저장 중...'
                      : editingSiteId
                        ? '수정'
                        : '추가'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>사이트ID 목록</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>총 {siteIds.length}개</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                로딩 중...
              </div>
            ) : siteIds.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                등록된 사이트ID가 없습니다
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>골프장</TableHead>
                      <TableHead>지역</TableHead>
                      <TableHead>사이트ID</TableHead>
                      <TableHead>이름</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead className="text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {siteIds.map((siteId) => (
                      <TableRow key={siteId.id}>
                        <TableCell className="font-medium">
                          {siteId.golf_clubs?.name || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {siteId.golf_clubs?.region || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {siteId.site_id}
                        </TableCell>
                        <TableCell>{siteId.name}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Badge
                              variant={siteId.disabled ? 'destructive' : 'default'}
                              className="cursor-pointer"
                              onClick={() => toggleStatus(siteId, 'disabled')}
                            >
                              {siteId.disabled ? '비활성' : '활성'}
                            </Badge>
                            {siteId.hidden && (
                              <Badge
                                variant="outline"
                                className="cursor-pointer"
                                onClick={() => toggleStatus(siteId, 'hidden')}
                              >
                                <EyeOff className="h-3 w-3 mr-1" />
                                숨김
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(siteId)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(siteId)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

export default withAuth(ManageSiteIdsPage, { requireAdmin: true })
