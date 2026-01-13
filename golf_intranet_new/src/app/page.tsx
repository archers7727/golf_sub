import { redirect } from 'next/navigation'

export default function RootPage() {
  // 미들웨어가 이미 인증 확인했으므로 여기서는 단순히 리다이렉트
  redirect('/dashboard/course-time')
}
