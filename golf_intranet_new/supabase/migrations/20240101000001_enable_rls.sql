-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE golf_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE black_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- users 정책
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND type = 'admin'
    )
  );

CREATE POLICY "Admins can update users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND type = 'admin'
    )
  );

-- golf_clubs 정책
CREATE POLICY "Everyone can view golf clubs" ON golf_clubs
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage golf clubs" ON golf_clubs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND type = 'admin'
    )
  );

-- courses 정책
CREATE POLICY "Everyone can view courses" ON courses
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage courses" ON courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND type = 'admin'
    )
  );

-- site_ids 정책
CREATE POLICY "Authenticated users can view site IDs" ON site_ids
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage site IDs" ON site_ids
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND type = 'admin'
    )
  );

-- course_times 정책
CREATE POLICY "Authenticated users can view course times" ON course_times
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own course times" ON course_times
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own course times" ON course_times
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own course times" ON course_times
  FOR DELETE USING (auth.uid() = author_id);

-- join_persons 정책
CREATE POLICY "Authenticated users can view join persons" ON join_persons
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own joins" ON join_persons
  FOR INSERT WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Users can update their own joins" ON join_persons
  FOR UPDATE USING (auth.uid() = manager_id);

CREATE POLICY "Admins can update all joins" ON join_persons
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND type = 'admin'
    )
  );

-- black_lists 정책
CREATE POLICY "Authenticated users can view black lists" ON black_lists
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert black lists" ON black_lists
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- holidays 정책
CREATE POLICY "Everyone can view holidays" ON holidays
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage holidays" ON holidays
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND type = 'admin'
    )
  );
