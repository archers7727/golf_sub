# Supabase 연결 가이드

> 🎯 이 가이드는 처음 프로젝트를 시작할 때 Supabase를 연결하는 방법을 설명합니다.

## 📋 사전 준비

- [Supabase](https://supabase.com) 계정 (무료)
- 이메일 인증 완료

## 1️⃣ Supabase 프로젝트 생성

### 단계 1: 새 프로젝트 만들기

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. "New project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: `golf-intranet` (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 (잘 기록해두세요!)
   - **Region**: `Northeast Asia (Seoul)` 선택
4. "Create new project" 클릭
5. ⏳ 프로젝트 생성 대기 (1-2분 소요)

### 단계 2: API 키 복사

1. 왼쪽 사이드바 → ⚙️ **Settings**
2. **API** 탭 클릭
3. 다음 정보 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGc...` (긴 문자열)

## 2️⃣ 환경 변수 설정

### `.env.local` 파일 업데이트

프로젝트 루트의 `.env.local` 파일을 열고 수정:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Settings (그대로 유지)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **중요**: 복사한 실제 값으로 교체하세요!

## 3️⃣ 데이터베이스 스키마 적용

### 단계 1: SQL Editor 열기

1. Supabase Dashboard 왼쪽 사이드바
2. 🗂️ **SQL Editor** 클릭
3. "New query" 버튼 클릭

### 단계 2: 스키마 생성

1. 프로젝트의 `supabase/migrations/20240101000000_create_initial_schema.sql` 파일 열기
2. 전체 내용 복사
3. SQL Editor에 붙여넣기
4. ▶️ **Run** 버튼 클릭
5. ✅ 성공 메시지 확인

### 단계 3: RLS 정책 적용

1. `supabase/migrations/20240101000001_enable_rls.sql` 파일 열기
2. 전체 내용 복사
3. 새 쿼리 창에 붙여넣기
4. ▶️ **Run** 버튼 클릭
5. ✅ 성공 메시지 확인

### 확인하기

왼쪽 사이드바 → 🗄️ **Table Editor**에서 다음 테이블이 보여야 함:
- users
- golf_clubs
- courses
- site_ids
- course_times
- join_persons
- black_lists
- holidays

## 4️⃣ 테스트 사용자 생성

### 방법 A: Authentication UI 사용

1. 왼쪽 사이드바 → 🔐 **Authentication**
2. **Users** 탭
3. "Add user" → "Create new user" 클릭
4. 정보 입력:
   - **Email**: `01012345678@golf-intranet.local`
   - **Password**: 원하는 비밀번호 (최소 6자)
   - **Auto Confirm User**: ✅ 체크
5. "Create user" 클릭
6. 생성된 사용자의 **UUID 복사** (예: `a1b2c3d4-...`)

### 방법 B: SQL로 직접 생성

SQL Editor에서 실행:

```sql
-- 1. Auth 사용자 생성 (Supabase가 자동으로 처리)
-- UI에서 생성한 사용자의 UUID를 확인

-- 2. Users 테이블에 프로필 추가
INSERT INTO public.users (id, type, phone_number, name, charge_rate)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',  -- ⚠️ 위에서 복사한 UUID로 교체!
  'admin',                                  -- 'admin' 또는 'manager'
  '01012345678',
  '관리자',
  10
);
```

⚠️ **중요**: `id`를 Authentication에서 생성된 실제 UUID로 교체하세요!

## 5️⃣ 개발 서버 실행

### 터미널에서 실행

```bash
cd golf_intranet_new
pnpm dev
```

### 브라우저에서 확인

1. `http://localhost:3000` 열기
2. 로그인 페이지로 리다이렉트됨
3. 로그인 정보 입력:
   - **전화번호**: `01012345678`
   - **비밀번호**: 위에서 설정한 비밀번호
4. "로그인" 클릭
5. ✅ 대시보드로 이동하면 성공!

## 6️⃣ 테스트 데이터 추가

### 골프장 추가

SQL Editor에서 실행:

```sql
-- 골프장 추가
INSERT INTO public.golf_clubs (region, name)
VALUES
  ('경기북부', '테스트 골프클럽'),
  ('경기남부', '샘플 CC');

-- 코스 추가
INSERT INTO public.courses (club_id, region, golf_club_name, course_name)
SELECT
  id,
  region,
  name,
  '동코스'
FROM public.golf_clubs
LIMIT 1;
```

### 사이트ID 추가

```sql
INSERT INTO public.site_ids (site_id, name, golf_club_id)
SELECT
  'test001',
  '테스트 사이트ID',
  id
FROM public.golf_clubs
LIMIT 1;
```

### 테스트 타임 추가

```sql
INSERT INTO public.course_times (
  author_id,
  course_id,
  reserved_time,
  reserved_name,
  green_fee,
  charge_fee
)
SELECT
  (SELECT id FROM public.users LIMIT 1),
  (SELECT id FROM public.courses LIMIT 1),
  NOW() + INTERVAL '3 days',
  '홍길동',
  120000,
  10000;
```

## ✅ 확인 사항

### 로그인 성공 후 확인

- [ ] 사이드바가 정상적으로 표시됨
- [ ] 사용자 이름이 사이드바 하단에 표시됨
- [ ] "코스 타임 관리" 페이지에 접근 가능
- [ ] 테스트 데이터가 목록에 표시됨

### 기능 테스트

1. **타임 등록**
   - 사이드바 → "타임 등록" 클릭
   - 폼 작성 후 등록
   - 목록에서 확인

2. **텍스트 뷰**
   - 사이드바 → "텍스트 뷰" 클릭
   - 모바일 친화적 화면 확인

3. **예약 관리**
   - 타임 상세 페이지에서 조인 추가
   - 예약 관리 페이지에서 확인

## 🐛 문제 해결

### 로그인 실패

**증상**: "로그인 실패" 에러
**해결**:
1. users 테이블에 프로필이 있는지 확인
2. phone_number가 정확한지 확인
3. 브라우저 개발자 도구 → Console 탭에서 에러 확인

### 데이터가 보이지 않음

**증상**: 빈 목록 표시
**해결**:
1. Table Editor에서 데이터가 실제로 있는지 확인
2. RLS 정책이 올바르게 적용되었는지 확인
3. 브라우저 개발자 도구 → Network 탭에서 API 응답 확인

### 환경 변수 오류

**증상**: "Invalid Supabase URL" 에러
**해결**:
1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. URL에 `https://`가 포함되어 있는지 확인
3. 개발 서버 재시작 (`Ctrl+C` 후 `pnpm dev`)

## 🎉 완료!

이제 모든 기능을 테스트할 수 있습니다!

- 📝 코스 타임 추가/수정/삭제
- 📱 텍스트 뷰 (모바일)
- 👥 조인 관리
- 🔐 권한별 메뉴 (Manager/Admin)

---

**다음 단계**: `PROGRESS.md`를 참고하여 12-15단계 구현 시작
