import { createClient } from "@supabase/supabase-js";

// Get your Supabase URL and Anon Key from environment variables
const supabaseUrl =
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL || "https://hcfqtgydoonpyskxibyt.supabase.co";
const supabaseAnonKey =
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_rV89m4GouX2LLFqRgzSNEQ_AywB-6Ne";

/**
 * The Supabase client to interact with your database.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/*
  --- DATABASE SCHEMA (FINAL PRODUCTION V8) ---
  --- FULL RESTORATION WITH OPTIMIZED ADMIN CLEARANCE, LEVEL ACCESS CONTROL, AND CLASSROOMS ---

  -- 1. Create User Roles Type
  DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'student');
  EXCEPTION
      WHEN duplicate_object THEN null;
  END $$;

  -- 2. Profiles
  CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    score INTEGER DEFAULT 0,
    avatar_url TEXT,
    xp INTEGER DEFAULT 0,
    role user_role NOT NULL DEFAULT 'student',
    is_admin BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    work_duration INTEGER DEFAULT 25,
    break_duration INTEGER DEFAULT 5,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
  );

  -- 3. Levels
  CREATE TABLE IF NOT EXISTS levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    level_order INTEGER UNIQUE NOT NULL,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
  );

  -- 4. Lectures
  CREATE TABLE IF NOT EXISTS lectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level_id UUID REFERENCES levels(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    content_blocks JSONB DEFAULT '[]',
    video_url TEXT,
    pdf_url TEXT,
    slot_number INTEGER NOT NULL CHECK (slot_number >= 1 AND slot_number <= 12),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(level_id, slot_number)
  );

  -- 5. Exams
  CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level_id UUID REFERENCES levels(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    questions JSONB NOT NULL,
    passing_score INTEGER DEFAULT 70,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
  );

  -- 6. Direct Messages
  CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
  );

  -- 7. Level Chats
  CREATE TABLE IF NOT EXISTS level_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level_id UUID REFERENCES levels(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
  );

  -- 8. Student Progress table
  CREATE TABLE IF NOT EXISTS student_progress (
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (student_id, lecture_id)
  );

  -- 9. Games table (Tic-Tac-Toe)
  CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_x UUID REFERENCES profiles(id) ON DELETE CASCADE,
    player_o UUID REFERENCES profiles(id) ON DELETE CASCADE,
    board JSONB DEFAULT '[null, null, null, null, null, null, null, null, null]',
    current_turn TEXT DEFAULT 'X',
    status TEXT DEFAULT 'pending',
    winner TEXT,
    winner_id UUID REFERENCES profiles(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
  );

  -- 10. Todos table
  CREATE TABLE IF NOT EXISTS todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    task TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'medium',
    category TEXT DEFAULT 'Research',
    is_completed BOOLEAN DEFAULT false,
    time_limit INTEGER DEFAULT 25,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
  );

  -- 11. Level Access table (Whitelist for specific users)
  CREATE TABLE IF NOT EXISTS level_access (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    level_id UUID REFERENCES levels(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (user_id, level_id)
  );

  -- 12. Helper Functions (Optimized with Security Definer to prevent recursion)
  CREATE OR REPLACE FUNCTION is_admin() 
  RETURNS BOOLEAN AS $$
  BEGIN
    RETURN EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)
    );
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE OR REPLACE FUNCTION is_moderator() 
  RETURNS BOOLEAN AS $$
  BEGIN
    RETURN EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    );
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE OR REPLACE FUNCTION is_approved() 
  RETURNS BOOLEAN AS $$
  BEGIN
    RETURN EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND (is_approved = true OR role IN ('admin', 'moderator'))
    );
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  CREATE OR REPLACE FUNCTION has_level_access(l_id UUID) 
  RETURNS BOOLEAN AS $$
  BEGIN
    RETURN EXISTS (
      SELECT 1 FROM level_access 
      WHERE user_id = auth.uid() AND level_id = l_id
    );
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- 13. Enable Row Level Security (RLS)
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
  ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
  ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
  ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
  ALTER TABLE level_chats ENABLE ROW LEVEL SECURITY;
  ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
  ALTER TABLE games ENABLE ROW LEVEL SECURITY;
  ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
  ALTER TABLE level_access ENABLE ROW LEVEL SECURITY;

  -- 14. Security Policies (RESTORED & OPTIMIZED)

  -- Profiles
  DROP POLICY IF EXISTS "Public read profiles" ON profiles;
  CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Users update own profile" ON profiles;
  CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
  DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
  CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
  DROP POLICY IF EXISTS "Admins full access" ON profiles;
  CREATE POLICY "Admins full access" ON profiles FOR ALL USING (is_admin());

  -- Levels
  DROP POLICY IF EXISTS "View levels" ON levels;
  CREATE POLICY "View levels" ON levels FOR SELECT USING (is_moderator() OR (is_published = true AND (is_approved() AND has_level_access(id))));
  DROP POLICY IF EXISTS "Manage levels" ON levels;
  CREATE POLICY "Manage levels" ON levels FOR ALL USING (is_moderator());

  -- Level Access
  DROP POLICY IF EXISTS "View own level access" ON level_access;
  CREATE POLICY "View own level_access" ON level_access FOR SELECT USING (auth.uid() = user_id OR is_moderator());
  DROP POLICY IF EXISTS "Manage level access" ON level_access;
  CREATE POLICY "Manage level_access" ON level_access FOR ALL USING (is_moderator());

  -- Lectures
  DROP POLICY IF EXISTS "View lectures" ON lectures;
  CREATE POLICY "View lectures" ON lectures FOR SELECT USING (is_moderator() OR (is_approved() AND has_level_access(level_id)));
  DROP POLICY IF EXISTS "Manage lectures" ON lectures;
  CREATE POLICY "Manage lectures" ON lectures FOR ALL USING (is_moderator());

  -- Exams
  DROP POLICY IF EXISTS "View exams" ON exams;
  CREATE POLICY "View exams" ON exams FOR SELECT USING (is_moderator() OR (is_approved() AND has_level_access(level_id)));
  DROP POLICY IF EXISTS "Manage exams" ON exams;
  CREATE POLICY "Manage exams" ON exams FOR ALL USING (is_moderator());

  -- Messages
  DROP POLICY IF EXISTS "View messages" ON direct_messages;
  CREATE POLICY "View messages" ON direct_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR is_admin());
  DROP POLICY IF EXISTS "Send messages" ON direct_messages;
  CREATE POLICY "Send messages" ON direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

  -- Level Chats
  DROP POLICY IF EXISTS "View chat" ON level_chats;
  CREATE POLICY "View chat" ON level_chats FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Post chat" ON level_chats;
  CREATE POLICY "Post chat" ON level_chats FOR INSERT WITH CHECK (auth.uid() = sender_id);

  -- Progress
  DROP POLICY IF EXISTS "Manage progress" ON student_progress;
  CREATE POLICY "Manage progress" ON student_progress FOR ALL USING (auth.uid() = student_id OR is_moderator());

  -- Games
  DROP POLICY IF EXISTS "View games" ON games;
  CREATE POLICY "View games" ON games FOR SELECT USING (true);
  DROP POLICY IF EXISTS "Update games" ON games;
  CREATE POLICY "Update games" ON games FOR UPDATE USING (auth.uid() = player_x OR auth.uid() = player_o OR is_admin());
  DROP POLICY IF EXISTS "Insert games" ON games;
  CREATE POLICY "Insert games" ON games FOR INSERT WITH CHECK (auth.uid() = player_x);

  -- Todos
  DROP POLICY IF EXISTS "Manage todos" ON todos;
  CREATE POLICY "Manage todos" ON todos FOR ALL USING (auth.uid() = user_id OR is_admin());

  -- 15. SET ADMIN PERMISSIONS (aliahmedsabry8@gmail.com)
  UPDATE profiles 
  SET role = 'admin', is_admin = true, is_approved = true 
  WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'aliahmedsabry8@gmail.com'
  );

*/
