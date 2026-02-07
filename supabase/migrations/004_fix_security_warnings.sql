-- =====================================================
-- Migration: Fix Security Warnings
-- Version: 1.0.0
-- Date: 2026-02-07
-- Description: Fix function search_path and RLS policy security warnings
-- =====================================================

-- =====================================================
-- 1. FIX FUNCTION SEARCH_PATH (8 functions)
-- =====================================================

-- Fix: handle_new_user
ALTER FUNCTION public.handle_new_user() SET search_path = '';

-- Fix: reset_daily_limits
ALTER FUNCTION public.reset_daily_limits() SET search_path = '';

-- Fix: check_and_increment_limit
ALTER FUNCTION public.check_and_increment_limit(uuid) SET search_path = '';

-- Fix: increment_photo_usage
ALTER FUNCTION public.increment_photo_usage(uuid, date) SET search_path = '';

-- Fix: get_photo_stats
ALTER FUNCTION public.get_photo_stats(uuid, date, date) SET search_path = '';

-- Fix: get_current_photo_usage
ALTER FUNCTION public.get_current_photo_usage(uuid) SET search_path = '';

-- Fix: update_photo_usage_timestamp
ALTER FUNCTION public.update_photo_usage_timestamp() SET search_path = '';

-- Fix: cleanup_old_photo_usage
ALTER FUNCTION public.cleanup_old_photo_usage() SET search_path = '';

-- =====================================================
-- 2. FIX RLS POLICIES (2 policies)
-- =====================================================

-- Fix: photo_usage policy - restrict to service_role instead of all roles
DROP POLICY IF EXISTS "Service role can manage photo usage" ON public.photo_usage;

CREATE POLICY "Service role can manage photo usage"
  ON public.photo_usage
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix: photo_analysis_log policy - restrict to service_role
DROP POLICY IF EXISTS "Service role can write photo logs" ON public.photo_analysis_log;

CREATE POLICY "Service role can write photo logs"
  ON public.photo_analysis_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✓ Migration 004_fix_security_warnings completed successfully!';
  RAISE NOTICE '✓ Fixed search_path for 8 functions';
  RAISE NOTICE '✓ Fixed RLS policies to restrict to service_role only';
  RAISE NOTICE '✓ All security warnings should now be resolved';
END $$;
