import { withAuth } from '@/lib/hooks/useRequireAuth'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

function CourseTimePage({ profile }: any) {
  return (
    <DashboardLayout profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">코스 타임 관리</h1>
          <p className="text-muted-foreground">여기에서 코스 타임을 관리할 수 있습니다.</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <p>코스 타임 목록이 표시될 예정입니다.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Phase 4에서 구현될 예정입니다.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default withAuth(CourseTimePage)
