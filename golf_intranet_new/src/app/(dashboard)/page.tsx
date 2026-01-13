'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/course-time')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
}
