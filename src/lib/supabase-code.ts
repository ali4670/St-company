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
  --- DATABASE SCHEMA (Run this in Supabase SQL Editor) ---

  -- 1. Create Profiles table
  CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    score INTEGER DEFAULT 0,
    is_admin BOOLEAN DEFAULT false,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
  );

  -- 2. Enable Row Level Security
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

  -- 3. Create Policies
  CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT USING (true);

  CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE USING (auth.uid() = id);

  CREATE POLICY "Admins can update all profiles" 
  ON profiles FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

  -- 4. Automatic Admin (Replace with your user ID after signup)
  -- UPDATE profiles SET is_admin = true WHERE username = 'aliahmedsabry8';
*/

// --- Example Usage ---

/*
// Fetch leaderboard
const { data, error } = await supabase
  .from('profiles')
  .select('username, score')
  .order('score', { ascending: false })
  .limit(10);
*/
