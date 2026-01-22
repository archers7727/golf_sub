import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { NextApiRequest, NextApiResponse } from 'next'
import type { GetServerSidePropsContext } from 'next'
import type { Database } from './types'

// API Routes용 클라이언트
export function createClient(req: NextApiRequest, res: NextApiResponse) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies[name]
        },
        set(name: string, value: string, options: CookieOptions) {
          res.setHeader('Set-Cookie', `${name}=${value}; Path=/; ${options.maxAge ? `Max-Age=${options.maxAge}` : ''}`)
        },
        remove(name: string, options: CookieOptions) {
          res.setHeader('Set-Cookie', `${name}=; Path=/; Max-Age=0`)
        },
      },
    }
  )
}

// getServerSideProps용 클라이언트
export function createSSRClient(context: GetServerSidePropsContext) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return context.req.cookies[name]
        },
        set(name: string, value: string, options: CookieOptions) {
          context.res.setHeader(
            'Set-Cookie',
            `${name}=${value}; Path=/; ${options.maxAge ? `Max-Age=${options.maxAge}` : ''}`
          )
        },
        remove(name: string, options: CookieOptions) {
          context.res.setHeader('Set-Cookie', `${name}=; Path=/; Max-Age=0`)
        },
      },
    }
  )
}
