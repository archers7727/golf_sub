# 골프 인트라넷 V2 - 새 프로젝트 계획서

> **작성일**: 2026-01-13
> **목적**: Pages Router 기반 단순하고 안정적인 구조로 처음부터 재구축
> **유지**: 기존 Supabase 데이터베이스 (스키마, 테이블, RLS 모두 그대로)

---

## 📋 목차

1. [왜 처음부터 다시 만드나요?](#why)
2. [기술 스택](#tech-stack)
3. [프로젝트 구조](#structure)
4. [라우팅 전략](#routing)
5. [인증 전략](#auth)
6. [구현 단계](#phases)
7. [예상 파일 리스트](#files)
8. [승인 체크리스트](#checklist)

---

## 🤔 왜 처음부터 다시 만드나요? {#why}

### 기존 프로젝트 문제점
- ❌ App Router + Route Groups + Middleware = 복잡한 구조
- ❌ 9번의 수정 시도에도 404 에러 해결 안됨
- ❌ 로컬에서는 작동하지만 Vercel 배포 시 실패
- ❌ Next.js App Router의 복잡한 캐싱/렌더링 동작

### 새 프로젝트 방향
- ✅ Pages Router: 검증된 안정적인 방식
- ✅ 단순한 폴더 구조 (Route Groups 없음)
- ✅ Middleware 없음 (HOC/Layout 기반 인증)
- ✅ 명확한 라우팅 (파일 = URL)

---

## 🛠 기술 스택 {#tech-stack}

### 프레임워크
```
Next.js 16.1.1 (Pages Router)
React 19.2.3
TypeScript 5.9.3
```

### 스타일링
```
Tailwind CSS 4.1.18
shadcn/ui (Button, Input, Dialog, Table 등)
Lucide React (아이콘)
```

### 백엔드/상태관리
```
Supabase 2.90.1 (기존 DB 그대로 사용)
Zustand 5.0.10 (클라이언트 상태)
```

### 폼/검증
```
React Hook Form 7.71.0
Zod 4.3.5
```

### 유틸리티
```
date-fns 4.1.0 (날짜)
sonner 2.0.7 (토스트)
```

---

## 📁 프로젝트 구조 {#structure}

```
golf-intranet-v2/
├── public/                          # 정적 파일
├── src/
│   ├── pages/                       # 페이지 (Pages Router)
│   │   ├── _app.tsx                 # 전역 레이아웃 + Toaster
│   │   ├── _document.tsx            # HTML 문서 설정
│   │   ├── index.tsx                # 로그인 페이지 (/)
│   │   │
│   │   └── dashboard/               # 대시보드 영역 (인증 필요)
│   │       ├── _layout.tsx          # 대시보드 레이아웃 (Sidebar + Header)
│   │       │
│   │       ├── course-time/
│   │       │   ├── index.tsx        # 코스타임 목록
│   │       │   ├── register.tsx     # 타임 등록
│   │       │   ├── edit/[id].tsx    # 타임 수정
│   │       │   └── text-view.tsx    # 모바일 텍스트 뷰
│   │       │
│   │       ├── reservation/
│   │       │   ├── index.tsx        # 예약 목록
│   │       │   └── [id].tsx         # 예약 상세
│   │       │
│   │       ├── black-list.tsx       # 블랙리스트
│   │       ├── my-performance.tsx   # 내 실적 조회
│   │       ├── site-id-status.tsx   # 사이트ID 현황
│   │       │
│   │       └── admin/               # 관리자 전용
│   │           ├── users.tsx        # 유저 관리
│   │           ├── site-ids.tsx     # 사이트ID 관리
│   │           ├── deposit.tsx      # 입금 관리
│   │           └── performance.tsx  # 전체 실적
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── DashboardLayout.tsx  # 대시보드 레이아웃 컴포넌트
│   │   │   ├── Sidebar.tsx          # 사이드바
│   │   │   └── Header.tsx           # 헤더
│   │   │
│   │   ├── ui/                      # shadcn/ui 컴포넌트
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   │
│   │   └── common/
│   │       ├── LoadingSpinner.tsx
│   │       └── EmptyState.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # Supabase 클라이언트
│   │   │   └── types.ts             # DB 타입 (기존 파일 복사)
│   │   │
│   │   ├── stores/
│   │   │   ├── course-time.ts       # 코스타임 Zustand
│   │   │   ├── join-person.ts       # 조인 Zustand
│   │   │   └── black-list.ts        # 블랙리스트 Zustand
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts           # 인증 훅
│   │   │   └── useRequireAuth.ts    # 인증 필수 HOC
│   │   │
│   │   └── utils/
│   │       ├── phone-to-email.ts    # 전화번호 → 이메일 변환
│   │       └── format.ts            # 날짜/금액 포맷
│   │
│   └── styles/
│       └── globals.css              # Tailwind + CSS 변수
│
├── .env.local                       # 환경 변수 (Supabase URL/Key)
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── package.json
```

---

## 🛣 라우팅 전략 {#routing}

### Pages Router 방식 (파일 = URL)

| 파일 경로 | URL | 설명 |
|----------|-----|------|
| `pages/index.tsx` | `/` | 로그인 페이지 |
| `pages/dashboard/course-time/index.tsx` | `/dashboard/course-time` | 코스타임 목록 |
| `pages/dashboard/course-time/register.tsx` | `/dashboard/course-time/register` | 타임 등록 |
| `pages/dashboard/course-time/edit/[id].tsx` | `/dashboard/course-time/edit/123` | 타임 수정 |
| `pages/dashboard/reservation/[id].tsx` | `/dashboard/reservation/123` | 예약 상세 |
| `pages/dashboard/admin/users.tsx` | `/dashboard/admin/users` | 유저 관리 |

### 장점
- ✅ 파일 경로가 곧 URL이라 직관적
- ✅ Route Groups 없음 → 혼란 없음
- ✅ Middleware 없음 → 404 문제 원천 차단

---

## 🔐 인증 전략 {#auth}

### Middleware 대신 HOC 패턴 사용

#### 1. `useAuth` 훅
```typescript
// lib/hooks/useAuth.ts
export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })
  }, [])

  return { user, loading }
}
```

#### 2. `withAuth` HOC (Higher-Order Component)
```typescript
// lib/hooks/useRequireAuth.ts
export function withAuth(Component: any, requireAdmin = false) {
  return function ProtectedPage(props: any) {
    const router = useRouter()
    const { user, loading } = useAuth()

    useEffect(() => {
      if (!loading && !user) {
        router.replace('/') // 로그인으로 리다이렉트
      }
    }, [user, loading, router])

    if (loading) return <LoadingSpinner />
    if (!user) return null

    return <Component {...props} />
  }
}
```

#### 3. 페이지에서 사용
```typescript
// pages/dashboard/course-time/index.tsx
function CourseTimePage() {
  return <div>코스타임 목록</div>
}

export default withAuth(CourseTimePage)
```

### 장점
- ✅ Middleware 없음 → 빌드/배포 문제 없음
- ✅ 클라이언트 사이드 체크로 간단명료
- ✅ HOC 패턴으로 재사용 쉬움
- ✅ 로딩 상태 명확하게 관리

---

## 📅 구현 단계 {#phases}

### Phase 1: 프로젝트 기반 설정 (30분)
```
[ ] Next.js Pages Router 프로젝트 생성
[ ] 의존성 설치 (Supabase, Zustand, shadcn/ui)
[ ] TypeScript, Tailwind CSS 설정
[ ] 환경 변수 설정 (.env.local)
[ ] Supabase 클라이언트 설정
[ ] 기존 database.types.ts 복사
```

### Phase 2: 인증 시스템 (1시간)
```
[ ] useAuth 훅 구현
[ ] withAuth HOC 구현
[ ] 로그인 페이지 (pages/index.tsx)
[ ] 전화번호 → 이메일 변환 로직
[ ] 로그아웃 기능
```

### Phase 3: 레이아웃 구축 (1시간)
```
[ ] _app.tsx (Toaster 추가)
[ ] DashboardLayout 컴포넌트
[ ] Sidebar (접기/펼치기, 메뉴 아이템)
[ ] Header (페이지명, 사용자 정보)
[ ] shadcn/ui 컴포넌트 설치 (Button, Input, Dialog 등)
```

### Phase 4: 코스타임 관리 (2시간)
```
[ ] Zustand 스토어 (course-time-store.ts)
[ ] 코스타임 목록 페이지
[ ] 타임 등록 페이지 (React Hook Form + Zod)
[ ] 타임 수정 페이지
[ ] 텍스트 뷰 (모바일)
```

### Phase 5: 예약 관리 (1.5시간)
```
[ ] Zustand 스토어 (join-person-store.ts)
[ ] 예약 목록 페이지
[ ] 예약 상세 페이지 (조인 추가/삭제)
```

### Phase 6: 부가 기능 (2시간)
```
[ ] Zustand 스토어 (black-list-store.ts)
[ ] 블랙리스트 페이지
[ ] 내 실적 조회 페이지
[ ] 사이트ID 현황 페이지
```

### Phase 7: 관리자 기능 (2시간)
```
[ ] 유저 관리 페이지
[ ] 사이트ID 관리 페이지
[ ] 입금 관리 페이지
[ ] 전체 실적 조회 페이지
```

### Phase 8: 테스트 & 배포 (1시간)
```
[ ] 로컬 테스트 (모든 페이지)
[ ] Vercel 배포
[ ] 프로덕션 테스트
[ ] 버그 수정
```

**총 예상 시간: 약 11시간 (실제로는 6-8시간 가능)**

---

## 📝 예상 파일 리스트 (작성할 파일들) {#files}

### 설정 파일 (6개)
```
✓ package.json
✓ tsconfig.json
✓ next.config.ts
✓ tailwind.config.ts
✓ .env.local
✓ .prettierrc
```

### 페이지 파일 (18개)
```
✓ pages/_app.tsx
✓ pages/_document.tsx
✓ pages/index.tsx (로그인)
✓ pages/dashboard/course-time/index.tsx
✓ pages/dashboard/course-time/register.tsx
✓ pages/dashboard/course-time/edit/[id].tsx
✓ pages/dashboard/course-time/text-view.tsx
✓ pages/dashboard/reservation/index.tsx
✓ pages/dashboard/reservation/[id].tsx
✓ pages/dashboard/black-list.tsx
✓ pages/dashboard/my-performance.tsx
✓ pages/dashboard/site-id-status.tsx
✓ pages/dashboard/admin/users.tsx
✓ pages/dashboard/admin/site-ids.tsx
✓ pages/dashboard/admin/deposit.tsx
✓ pages/dashboard/admin/performance.tsx
✓ pages/404.tsx (커스텀 404)
✓ pages/500.tsx (커스텀 500)
```

### 컴포넌트 (15개)
```
✓ components/layout/DashboardLayout.tsx
✓ components/layout/Sidebar.tsx
✓ components/layout/Header.tsx
✓ components/common/LoadingSpinner.tsx
✓ components/common/EmptyState.tsx
✓ components/ui/button.tsx (shadcn)
✓ components/ui/input.tsx (shadcn)
✓ components/ui/dialog.tsx (shadcn)
✓ components/ui/table.tsx (shadcn)
✓ components/ui/card.tsx (shadcn)
✓ components/ui/badge.tsx (shadcn)
✓ components/ui/select.tsx (shadcn)
✓ components/ui/form.tsx (shadcn)
✓ components/ui/tabs.tsx (shadcn)
✓ components/ui/separator.tsx (shadcn)
```

### 라이브러리 (10개)
```
✓ lib/supabase/client.ts
✓ lib/supabase/types.ts (기존에서 복사)
✓ lib/stores/course-time.ts
✓ lib/stores/join-person.ts
✓ lib/stores/black-list.ts
✓ lib/hooks/useAuth.ts
✓ lib/hooks/useRequireAuth.ts
✓ lib/utils/phone-to-email.ts
✓ lib/utils/format.ts
✓ lib/utils.ts (shadcn cn 함수)
```

### 스타일 (1개)
```
✓ styles/globals.css
```

**총 파일 수: 약 50개**

---

## ✅ 승인 체크리스트 {#checklist}

아래 항목을 확인하신 후 승인해주세요:

### 구조
- [ ] Pages Router 사용 (App Router 아님)
- [ ] Route Groups 없음 (단순한 폴더 구조)
- [ ] Middleware 없음 (HOC 기반 인증)

### 기술 스택
- [ ] Next.js 16 + React 19 + TypeScript
- [ ] Tailwind CSS + shadcn/ui
- [ ] Supabase (기존 DB 그대로)
- [ ] Zustand (상태 관리)

### 인증
- [ ] withAuth HOC 방식
- [ ] 클라이언트 사이드 체크
- [ ] 전화번호 → 이메일 변환

### 기능
- [ ] 코스타임 관리 (등록/수정/삭제/텍스트뷰)
- [ ] 예약 관리 (조인 추가/삭제)
- [ ] 블랙리스트, 내 실적, 사이트ID 현황
- [ ] 관리자 기능 (유저/사이트ID/입금/실적)

### 구현 방식
- [ ] 단계별 구현 (Phase 1-8)
- [ ] 각 단계마다 테스트
- [ ] Vercel 배포 최종 확인

---

## 🚀 승인 후 진행 절차

1. **승인 확인** → "승인합니다" 또는 "시작하세요" 응답
2. **프로젝트 생성** → `golf-intranet-v2` 폴더 생성
3. **Phase 1 시작** → 기반 설정
4. **순차 구현** → Phase 2-8 진행
5. **각 Phase 완료 시 확인 요청**
6. **최종 배포** → Vercel

---

## ❓ 질문사항

이 계획서에 대해 수정하고 싶은 부분이나 질문이 있으시면 말씀해주세요:

1. **프로젝트명**: `golf-intranet-v2` 괜찮으신가요?
2. **구조**: Pages Router + HOC 인증 방식 동의하시나요?
3. **구현 순서**: Phase 1-8 순서가 적절한가요?
4. **기타**: 추가하고 싶은 기능이나 변경사항이 있나요?

---

**이 계획서를 검토하시고 승인해주시면 바로 시작하겠습니다!** 🙌
