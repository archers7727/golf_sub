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
