'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useCourseTimeStore } from '@/lib/stores/course-time-store'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const formSchema = z.object({
  reserved_time: z.string().min(1, '예약 시간을 입력해주세요'),
  reserved_name: z.string().min(1, '예약자명을 입력해주세요'),
  green_fee: z.coerce.number().min(0),
  charge_fee: z.coerce.number().min(0),
  requirements: z.enum(['조건없음', '인회필', '예변필', '인회필/예변필']),
  memo: z.string().optional(),
})

export default function RegisterCourseTimePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')
  const { createCourseTime, updateCourseTime, courseTimes } = useCourseTimeStore()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requirements: '조건없음',
      green_fee: 0,
      charge_fee: 0,
      memo: '',
    },
  })

  // 수정 모드일 때 데이터 로드
  useEffect(() => {
    if (editId) {
      const existingTime = courseTimes.find((t) => t.id === editId)
      if (existingTime) {
        form.reset({
          reserved_time: existingTime.reserved_time.slice(0, 16), // datetime-local 형식
          reserved_name: existingTime.reserved_name,
          green_fee: existingTime.green_fee,
          charge_fee: existingTime.charge_fee,
          requirements: existingTime.requirements,
          memo: existingTime.memo || '',
        })
      }
    }
  }, [editId, courseTimes, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true)
    try {
      if (editId) {
        await updateCourseTime(editId, values)
        toast.success('수정 완료', {
          description: '타임이 수정되었습니다.',
        })
      } else {
        await createCourseTime({
          ...values,
          author_id: user?.id || null,
        })
        toast.success('등록 완료', {
          description: '타임이 등록되었습니다.',
        })
      }
      router.push('/dashboard/course-time')
    } catch (error: any) {
      toast.error(editId ? '수정 실패' : '등록 실패', {
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {editId ? '타임 수정' : '타임 등록'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {editId ? '타임 정보를 수정합니다' : '새로운 예약 타임을 등록합니다'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>타임 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reserved_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>예약 시간</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reserved_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>예약자명</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="홍길동" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="green_fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>그린피 (원)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="charge_fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>수수료 (원)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>요구사항</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="조건없음">조건없음</SelectItem>
                        <SelectItem value="인회필">인회필</SelectItem>
                        <SelectItem value="예변필">예변필</SelectItem>
                        <SelectItem value="인회필/예변필">인회필/예변필</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="memo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>메모</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="추가 메모사항" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? (editId ? '수정 중...' : '등록 중...') : editId ? '수정' : '등록'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  취소
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
