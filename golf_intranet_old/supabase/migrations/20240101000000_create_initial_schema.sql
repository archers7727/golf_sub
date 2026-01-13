-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom Types
CREATE TYPE user_type AS ENUM ('manager', 'admin');
CREATE TYPE course_time_status AS ENUM ('판매완료', '미판매', '타업체마감');
CREATE TYPE join_person_status AS ENUM ('입금확인전', '입금확인중', '입금완료', '환불확인중', '환불완료');
CREATE TYPE golf_region AS ENUM ('경기북부', '경기남부', '충청도', '경상남도', '강원도');
CREATE TYPE reservable_count_type AS ENUM ('TOTAL', 'DAYEND');
CREATE TYPE requirements_type AS ENUM ('조건없음', '인회필', '예변필', '인회필/예변필');

-- 1. users 테이블 (Supabase Auth 확장)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  type user_type NOT NULL DEFAULT 'manager',
  phone_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  charge_rate INTEGER NOT NULL DEFAULT 0 CHECK (charge_rate >= 0 AND charge_rate <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 2. golf_clubs 테이블
CREATE TABLE public.golf_clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region golf_region NOT NULL,
  name TEXT NOT NULL,
  cancel_deadline_date INTEGER NOT NULL DEFAULT 0,
  cancel_deadline_hour INTEGER NOT NULL DEFAULT 0,
  reservable_count_type reservable_count_type NOT NULL DEFAULT 'TOTAL',
  reservable_count_1 INTEGER NOT NULL DEFAULT 0,
  reservable_count_2 INTEGER NOT NULL DEFAULT 0,
  hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 3. courses 테이블
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES golf_clubs(id) ON DELETE CASCADE,
  region golf_region NOT NULL,
  golf_club_name TEXT NOT NULL,
  course_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 4. site_ids 테이블
CREATE TABLE public.site_ids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id TEXT NOT NULL,
  name TEXT NOT NULL,
  golf_club_id UUID REFERENCES golf_clubs(id) ON DELETE CASCADE,
  disabled BOOLEAN NOT NULL DEFAULT FALSE,
  hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(site_id, golf_club_id)
);

-- 5. course_times 테이블
CREATE TABLE public.course_times (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  site_id UUID REFERENCES site_ids(id) ON DELETE SET NULL,
  reserved_time TIMESTAMPTZ NOT NULL,
  reserved_name TEXT NOT NULL,
  green_fee INTEGER NOT NULL DEFAULT 0,
  charge_fee INTEGER NOT NULL DEFAULT 0,
  requirements requirements_type NOT NULL DEFAULT '조건없음',
  flag INTEGER NOT NULL DEFAULT 0,
  memo TEXT,
  status course_time_status NOT NULL DEFAULT '미판매',
  block_until TIMESTAMPTZ,
  blocker_id UUID REFERENCES users(id) ON DELETE SET NULL,
  join_num INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. join_persons 테이블
CREATE TABLE public.join_persons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  time_id UUID REFERENCES course_times(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  join_type TEXT NOT NULL CHECK (join_type IN ('양도', '남여', '남', '여', '남남', '여여', '남남남', '여여여')),
  join_num INTEGER NOT NULL,
  phone_number TEXT NOT NULL,
  green_fee INTEGER NOT NULL DEFAULT 0,
  charge_fee INTEGER NOT NULL DEFAULT 0,
  charge_rate INTEGER NOT NULL DEFAULT 0,
  status join_person_status NOT NULL DEFAULT '입금확인전',
  refund_reason TEXT,
  refund_account TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. black_lists 테이블
CREATE TABLE public.black_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 8. holidays 테이블
CREATE TABLE public.holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_type ON users(type);
CREATE INDEX idx_golf_clubs_region ON golf_clubs(region);
CREATE INDEX idx_courses_club_id ON courses(club_id);
CREATE INDEX idx_site_ids_golf_club_id ON site_ids(golf_club_id);
CREATE INDEX idx_course_times_reserved_time ON course_times(reserved_time);
CREATE INDEX idx_course_times_author_id ON course_times(author_id);
CREATE INDEX idx_course_times_status ON course_times(status);
CREATE INDEX idx_join_persons_time_id ON join_persons(time_id);
CREATE INDEX idx_join_persons_manager_id ON join_persons(manager_id);
CREATE INDEX idx_join_persons_status ON join_persons(status);
CREATE INDEX idx_black_lists_phone ON black_lists(phone_number);
CREATE INDEX idx_holidays_date ON holidays(date);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_golf_clubs_updated_at BEFORE UPDATE ON golf_clubs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_ids_updated_at BEFORE UPDATE ON site_ids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_times_updated_at BEFORE UPDATE ON course_times
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_join_persons_updated_at BEFORE UPDATE ON join_persons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_black_lists_updated_at BEFORE UPDATE ON black_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
