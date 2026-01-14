-- Fix RLS policies to prevent timeout issues
-- This migration removes the problematic EXISTS subquery that was causing performance issues

-- Step 1: Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can manage golf clubs" ON golf_clubs;
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;

-- Step 2: Create optimized function for admin check
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

-- Step 3: Create new policies using the optimized function
CREATE POLICY "Admins can manage golf clubs" ON golf_clubs
  FOR ALL
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

CREATE POLICY "Admins can manage courses" ON courses
  FOR ALL
  USING (current_user_is_admin())
  WITH CHECK (current_user_is_admin());

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;
