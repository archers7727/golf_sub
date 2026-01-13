import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // 로그인하지 않은 사용자가 보호된 경로 접근 시
  if (!user && (pathname === '/' || pathname.startsWith('/dashboard'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 로그인한 사용자가 로그인 페이지 접근 시
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard/course-time', request.url))
  }

  // Admin 페이지 접근 제어
  if (user && pathname.startsWith('/dashboard/admin')) {
    const { data: userProfile } = await supabase
      .from('users')
      .select('type')
      .eq('id', user.id)
      .single()

    if (userProfile?.type !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard/course-time', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
