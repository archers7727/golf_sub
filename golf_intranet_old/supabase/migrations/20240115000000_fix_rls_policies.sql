-- Fix RLS policies to prevent timeout issues
-- This migration removes the problematic EXISTS subquery that was causing performance issues

-- Step 1: Drop existing problematic policies for golf_clubs and courses
DROP POLICY IF EXISTS "Admins can manage golf clubs" ON golf_clubs;
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;

-- Step 2: Drop problematic users policies (순환 참조 문제)
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;

-- Step 3: Create optimized function for admin check
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_type TEXT;
BEGIN
  -- Query user type with LIMIT for safety
  SELECT type INTO user_type
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1;

  RETURN COALESCE(user_type = 'admin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Add comment
COMMENT ON FUNCTION public.current_user_is_admin() IS
  'Cached function to check if current user is admin. Uses STABLE for query-level caching.';

-- Step 4: Create new policies using the optimized function

-- golf_clubs policies
CREATE POLICY "Admins can manage golf clubs" ON golf_clubs
  FOR ALL
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

-- courses policies
CREATE POLICY "Admins can manage courses" ON courses
  FOR ALL
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

-- users policies (순환 참조 제거 + 자기 profile 조회 허용)
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT
  USING (current_user_is_admin());

CREATE POLICY "Admins can update users" ON users
  FOR UPDATE
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;

-- Drop all old policies that use circular reference pattern
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Everyone can view golf clubs" ON golf_clubs;
DROP POLICY IF EXISTS "Everyone can view courses" ON courses;
DROP POLICY IF EXISTS "Authenticated users can view site IDs" ON site_ids;
DROP POLICY IF EXISTS "Admins can manage site IDs" ON site_ids;
DROP POLICY IF EXISTS "Authenticated users can view course times" ON course_times;
DROP POLICY IF EXISTS "Users can insert their own course times" ON course_times;
DROP POLICY IF EXISTS "Users can update their own course times" ON course_times;
DROP POLICY IF EXISTS "Users can delete their own course times" ON course_times;
DROP POLICY IF EXISTS "Authenticated users can view join persons" ON join_persons;
DROP POLICY IF EXISTS "Users can insert their own joins" ON join_persons;
DROP POLICY IF EXISTS "Users can update their own joins" ON join_persons;
DROP POLICY IF EXISTS "Admins can update all joins" ON join_persons;
DROP POLICY IF EXISTS "Authenticated users can view black lists" ON black_lists;
DROP POLICY IF EXISTS "Users can insert black lists" ON black_lists;
DROP POLICY IF EXISTS "Everyone can view holidays" ON holidays;
DROP POLICY IF EXISTS "Admins can manage holidays" ON holidays;

-- site_ids policies
CREATE POLICY "Authenticated users can view site IDs" ON site_ids
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage site IDs" ON site_ids
  FOR ALL
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

-- course_times policies (모든 매니저가 조회/수정 가능)
CREATE POLICY "Authenticated users can view course times" ON course_times
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert course times" ON course_times
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Admins and authors can update course times" ON course_times
  FOR UPDATE
  USING (current_user_is_admin() OR auth.uid() = author_id)
  WITH CHECK (current_user_is_admin() OR auth.uid() = author_id);

CREATE POLICY "Admins and authors can delete course times" ON course_times
  FOR DELETE
  USING (current_user_is_admin() OR auth.uid() = author_id);

-- join_persons policies (모든 매니저가 조회 가능, 자신이 추가한 것만 수정/삭제)
CREATE POLICY "Authenticated users can view join persons" ON join_persons
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert join persons" ON join_persons
  FOR INSERT
  WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Admins and managers can update join persons" ON join_persons
  FOR UPDATE
  USING (current_user_is_admin() OR auth.uid() = manager_id)
  WITH CHECK (current_user_is_admin() OR auth.uid() = manager_id);

CREATE POLICY "Admins and managers can delete join persons" ON join_persons
  FOR DELETE
  USING (current_user_is_admin() OR auth.uid() = manager_id);

-- black_lists policies
CREATE POLICY "Authenticated users can view black lists" ON black_lists
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert black lists" ON black_lists
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Admins and authors can manage black lists" ON black_lists
  FOR ALL
  USING (current_user_is_admin() OR auth.uid() = author_id)
  WITH CHECK (current_user_is_admin() OR auth.uid() = author_id);

-- holidays policies
CREATE POLICY "Authenticated users can view holidays" ON holidays
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage holidays" ON holidays
  FOR ALL
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());
