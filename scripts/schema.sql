-- Kutumb Database Schema
-- Run this in Supabase SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  surname TEXT NOT NULL,
  maiden_name TEXT,
  gender TEXT CHECK (gender IN ('male', 'female')),
  marital_status TEXT CHECK (marital_status IN ('single', 'married', 'widowed')),
  father_id UUID REFERENCES public.users(id),
  mother_id UUID REFERENCES public.users(id),
  spouse_id UUID REFERENCES public.users(id),
  birth_month TEXT,
  birth_year TEXT,
  profile_picture_url TEXT,
  description TEXT,
  is_deceased BOOLEAN DEFAULT false,
  death_date TEXT,
  family TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_users_father_id ON public.users(father_id);
CREATE INDEX IF NOT EXISTS idx_users_mother_id ON public.users(mother_id);
CREATE INDEX IF NOT EXISTS idx_users_spouse_id ON public.users(spouse_id);
CREATE INDEX IF NOT EXISTS idx_users_surname ON public.users(surname);
CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON public.users(is_deleted);
CREATE INDEX IF NOT EXISTS idx_users_family ON public.users(family);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (modify as needed for your security requirements)
CREATE POLICY "Enable read access for all users" ON public.users
  FOR SELECT USING (NOT is_deleted);

-- Create policy for authenticated users to insert
CREATE POLICY "Enable insert for authenticated users" ON public.users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy for users to update their own data
CREATE POLICY "Enable update for authenticated users" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Insert sample data (optional)
INSERT INTO public.users (name, surname, gender, marital_status, birth_year) VALUES
  ('રાજેશ', 'પટેલ', 'male', 'married', '1980'),
  ('પ્રિયા', 'શર્મા', 'female', 'married', '1985'),
  ('આનંદ', 'પટેલ', 'male', 'single', '2005'),
  ('સુમિત્રા', 'શર્મા', 'female', 'married', '1982'),
  ('વિક્રમ', 'પટેલ', 'male', 'married', '1983')
ON CONFLICT DO NOTHING;
