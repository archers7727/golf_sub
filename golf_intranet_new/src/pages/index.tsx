import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@/lib/supabase/client'
import { phoneToEmail, formatPhoneNumber } from '@/lib/utils/phone-to-email'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [emailOrPhone, setEmailOrPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // 이미 로그인되어 있는지 확인
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        router.replace('/dashboard/course-time')
      } else {
        setCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!emailOrPhone || !password) {
      toast.error('이메일/전화번호와 비밀번호를 입력해주세요')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // 이메일인지 전화번호인지 판단
      const isEmail = emailOrPhone.includes('@')
      const email = isEmail ? emailOrPhone : phoneToEmail(emailOrPhone)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        toast.success('로그인 성공!')
        router.push('/dashboard/course-time')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('로그인 실패: 이메일/전화번호 또는 비밀번호를 확인해주세요')
    } finally {
      setLoading(false)
    }
  }


  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">골프 인트라넷</CardTitle>
          <CardDescription>이메일 또는 전화번호로 로그인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailOrPhone">이메일 / 전화번호</Label>
              <Input
                id="emailOrPhone"
                type="text"
                placeholder="example@email.com 또는 01012345678"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                disabled={loading}
                autoComplete="username"
              />
              {emailOrPhone && !emailOrPhone.includes('@') && /^\d+$/.test(emailOrPhone) && (
                <p className="text-sm text-muted-foreground">
                  전화번호: {formatPhoneNumber(emailOrPhone)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
