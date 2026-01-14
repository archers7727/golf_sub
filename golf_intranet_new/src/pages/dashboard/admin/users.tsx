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
import { Users, Plus, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'
import { withAuth } from '@/lib/hooks/useRequireAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

type User = {
  id: string
  name: string
  phone_number: string
  type: 'manager' | 'admin'
  charge_rate: number
  created_at: string
}

function ManageUsersPage({ profile }: any) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    type: 'manager' as 'manager' | 'admin',
    charge_rate: 0,
    password: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('사용자 목록을 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        name: user.name,
        phone_number: user.phone_number,
        type: user.type,
        charge_rate: user.charge_rate,
        password: '',
      })
    } else {
      setEditingUser(null)
      setFormData({
        name: '',
        phone_number: '',
        type: 'manager',
        charge_rate: 0,
        password: '',
      })
    }
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()

    if (!formData.name || !formData.phone_number) {
      toast.error('이름과 전화번호를 입력해주세요')
      return
    }

    if (!editingUser && !formData.password) {
      toast.error('비밀번호를 입력해주세요')
      return
    }

    setSubmitting(true)

    try {
      if (editingUser) {
        // 수정
        const { error } = await supabase
          .from('users')
          .update({
            name: formData.name,
            phone_number: formData.phone_number,
            type: formData.type,
            charge_rate: formData.charge_rate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingUser.id)

        if (error) throw error

        toast.success('사용자가 수정되었습니다')
      } else {
        // 신규 추가 - username@internal.golf.local 형식 사용
        const username = formData.phone_number.replace(/-/g, '')
        const email = `${username}@internal.golf.local`

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              phone_number: formData.phone_number,
            },
          },
        })

        if (authError) throw authError

        if (authData.user) {
          // users 테이블에 정보 추가
          const { error: insertError } = await supabase.from('users').insert({
            id: authData.user.id,
            name: formData.name,
            phone_number: formData.phone_number,
            type: formData.type,
            charge_rate: formData.charge_rate,
          })

          if (insertError) throw insertError
        }

        toast.success('사용자가 추가되었습니다')
      }

      setDialogOpen(false)
      fetchUsers()
    } catch (error: any) {
      console.error('Error saving user:', error)
      toast.error(error.message || '저장에 실패했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (user: User) => {
    if (!confirm(`${user.name}님을 삭제하시겠습니까?`)) return

    const supabase = createClient()

    try {
      // Soft delete
      const { error } = await supabase
        .from('users')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) throw error

      toast.success('사용자가 삭제되었습니다')
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('삭제에 실패했습니다')
    }
  }

  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">유저 관리</h1>
            <p className="text-muted-foreground mt-1">매니저 계정을 관리합니다</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                유저 추가
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? '유저 수정' : '유저 추가'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingUser
                      ? '유저 정보를 수정합니다'
                      : '새로운 유저를 추가합니다'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">이름 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="홍길동"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">전화번호 *</Label>
                    <Input
                      id="phone"
                      value={formData.phone_number}
                      onChange={(e) =>
                        setFormData({ ...formData, phone_number: e.target.value })
                      }
                      placeholder="010-1234-5678"
                      required
                    />
                  </div>
                  {!editingUser && (
                    <div className="space-y-2">
                      <Label htmlFor="password">비밀번호 *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder="비밀번호"
                        required={!editingUser}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="type">권한 *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: 'manager' | 'admin') =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">매니저</SelectItem>
                        <SelectItem value="admin">관리자</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="charge_rate">수수료율 (%)</Label>
                    <Input
                      id="charge_rate"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.charge_rate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          charge_rate: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="0"
                    />
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
                    {submitting ? '저장 중...' : editingUser ? '수정' : '추가'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* 유저 목록 테이블 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>유저 목록</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>총 {users.length}명</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                로딩 중...
              </div>
            ) : users.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                등록된 유저가 없습니다
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>이름</TableHead>
                      <TableHead>전화번호</TableHead>
                      <TableHead>권한</TableHead>
                      <TableHead className="text-right">수수료율</TableHead>
                      <TableHead>가입일</TableHead>
                      <TableHead className="text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {user.phone_number}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.type === 'admin' ? 'default' : 'secondary'}>
                            {user.type === 'admin' ? '관리자' : '매니저'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {user.charge_rate}%
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(user.created_at), 'yyyy-MM-dd', {
                            locale: ko,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(user)}
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

export default withAuth(ManageUsersPage, { requireAdmin: true })
