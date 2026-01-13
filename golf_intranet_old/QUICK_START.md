# 🚀 빠른 시작 가이드

> 다음 개발자를 위한 5분 안에 시작하기

## 1️⃣ 프로젝트 설치 (2분)

```bash
cd /home/user/golf_sub/golf_intranet_new

# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.local.example .env.local
# .env.local 파일을 열어서 Supabase 정보 입력
```

## 2️⃣ Supabase 설정 (5분)

1. https://app.supabase.com 접속
2. 새 프로젝트 생성
3. Settings → API에서 복사:
   ```
   URL: https://xxx.supabase.co
   anon key: eyJxxx...
   ```
4. `.env.local`에 붙여넣기
5. SQL Editor에서 마이그레이션 실행:
   - `supabase/migrations/20240101000000_create_initial_schema.sql`
   - `supabase/migrations/20240101000001_enable_rls.sql`

## 3️⃣ 로컬 실행 (1분)

```bash
# 개발 서버 시작
pnpm dev

# http://localhost:3000 열기
```

✅ **로컬에서는 정상 작동합니다!**

## 4️⃣ 404 이슈 해결 (당신의 임무!)

### 방법 1: Middleware 제거 (가장 빠름 - 30분)

```bash
# 1. Middleware 비활성화
mv src/middleware.ts src/middleware.ts.backup

# 2. 레이아웃에서 인증 체크
# src/app/dashboard/layout.tsx 수정
```

```typescript
// src/app/dashboard/layout.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
```

```typescript
// src/app/page.tsx - 간단하게!
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.push('/login')
  }, [router])

  return <div>Redirecting...</div>
}
```

```bash
# 3. 빌드 & 배포
pnpm build
vercel --prod
```

### 방법 2: Route Groups 제거 (2시간)

```
현재: src/app/(dashboard)/...
변경: src/app/dashboard/...

현재: src/app/(auth)/login/...
변경: src/app/login/...
```

### 방법 3: Pages Router로 전환 (1일)

완전히 새로 시작 (시간 있을 때)

## 5️⃣ 테스트 계정 생성

Supabase Dashboard → Authentication → Users → Add User

또는 SQL:

```sql
-- Admin 계정
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('admin@golf.local', crypt('admin123', gen_salt('bf')), NOW());

INSERT INTO public.users (id, type, phone_number, name, charge_rate)
SELECT id, 'admin', '010-0000-0000', '관리자', 10
FROM auth.users WHERE email = 'admin@golf.local';
```

## 📝 체크리스트

- [ ] pnpm install 완료
- [ ] .env.local 설정 완료
- [ ] Supabase 프로젝트 생성
- [ ] 마이그레이션 실행
- [ ] 로컬 실행 확인 (pnpm dev)
- [ ] 테스트 계정 생성
- [ ] 404 이슈 해결 방법 선택
- [ ] 프로덕션 빌드 성공 (pnpm build)
- [ ] Vercel 배포 성공

## 🆘 트러블슈팅

### 빌드 실패 시

```bash
# 캐시 삭제
rm -rf .next
pnpm install
pnpm build
```

### TypeScript 에러 시

```bash
# 타입 체크 스킵 (임시)
pnpm build --no-lint
```

### Supabase 연결 실패 시

```typescript
// 테스트 파일 생성
const supabase = createClient()
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10))
```

## 📞 도움말

- 상세 문서: `HANDOFF_DOCUMENT.md`
- 진행 상황: `PROGRESS.md`
- 설정 가이드: `SETUP_GUIDE.md`

**화이팅! 💪**
