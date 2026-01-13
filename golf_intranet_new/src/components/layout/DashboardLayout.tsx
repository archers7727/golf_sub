import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import type { Database } from '@/lib/supabase/types'

type UserProfile = Database['public']['Tables']['users']['Row']

interface DashboardLayoutProps {
  children: ReactNode
  profile: UserProfile
}

export function DashboardLayout({ children, profile }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar profile={profile} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header profile={profile} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  )
}
