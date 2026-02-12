-- Add INSERT policy for users table
-- Migration: 006_add_users_insert_policy
-- Created: 2026-02-12

-- Drop policy if exists (ignore errors)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END$$;

-- Allow users to insert their own profile
-- This is needed as a fallback if the trigger doesn't work
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);
