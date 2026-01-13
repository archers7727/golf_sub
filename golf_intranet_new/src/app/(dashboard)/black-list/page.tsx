'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useBlackListStore } from '@/lib/stores/black-list-store'
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
import { UserX, Plus, Search, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'

export default function BlackListPage() {
  const { user } = useAuth()
  const { blackLists, loading, fetchBlackLists, createBlackList, deleteBlackList } =
    useBlackListStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    reason: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchBlackLists()
  }, [fetchBlackLists])

  const handleSearch = () => {
    fetchBlackLists(searchTerm)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    if (!formData.name || !formData.phone_number || !formData.reason) {
      toast.error('모든 필드를 입력해주세요')
      return
    }

    setSubmitting(true)
    try {
      await createBlackList({
        author_id: user.id,
        name: formData.name,
        phone_number: formData.phone_number,
        reason: formData.reason,
      })

      toast.success('블랙리스트에 추가되었습니다')
      setDialogOpen(false)
      setFormData({ name: '', phone_number: '', reason: '' })
    } catch (error) {
      console.error('Error creating blacklist:', error)
      toast.error('추가에 실패했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${name}님을 블랙리스트에서 삭제하시겠습니까?`)) return

    try {
      await deleteBlackList(id)
      toast.success('블랙리스트에서 삭제되었습니다')
    } catch (error) {
      console.error('Error deleting blacklist:', error)
      toast.error('삭제에 실패했습니다')
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">블랙리스트 관리</h1>
          <p className="text-muted-foreground mt-1">
            조인 차단 대상자를 관리합니다
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>블랙리스트 추가</DialogTitle>
                <DialogDescription>
                  차단할 고객의 정보를 입력하세요
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
                <div className="space-y-2">
                  <Label htmlFor="reason">사유 *</Label>
                  <Input
                    id="reason"
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                    placeholder="차단 사유를 입력하세요"
                    required
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
                  {submitting ? '추가 중...' : '추가'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 검색 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">검색</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">이름 또는 전화번호</Label>
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="검색어를 입력하세요"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" />
              검색
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 블랙리스트 테이블 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>블랙리스트 목록</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserX className="h-4 w-4" />
              <span>총 {blackLists.length}명</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              로딩 중...
            </div>
          ) : blackLists.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <UserX className="h-12 w-12 mb-2 opacity-50" />
              <p>블랙리스트가 없습니다</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>전화번호</TableHead>
                    <TableHead>사유</TableHead>
                    <TableHead>등록자</TableHead>
                    <TableHead>등록일</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blackLists.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {item.phone_number}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {item.reason}
                      </TableCell>
                      <TableCell>{item.users?.name || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(item.created_at), 'yyyy-MM-dd', {
                          locale: ko,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id, item.name)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
