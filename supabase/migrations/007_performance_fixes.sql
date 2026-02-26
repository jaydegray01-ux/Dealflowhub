-- ============================================================
-- Performance Fixes Migration
-- Addresses Supabase Database Linter warnings:
--   1. auth_rls_initplan — auth functions re-evaluated per row
--   2. multiple_permissive_policies — multiple permissive SELECT
--      policies on the same table for the same role/action
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Update is_admin() to evaluate auth.uid() once as an
--    init-plan rather than per row.
--    This transitively fixes the methods INSERT/UPDATE/DELETE
--    policies that call this helper.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'ADMIN'
  )
$$;

-- ─────────────────────────────────────────────────────────────
-- 2. profiles — fix auth_rls_initplan AND multiple_permissive_policies
--    The table has two permissive SELECT policies. Merge them into one
--    and wrap auth.uid() calls with (SELECT ...) so they are
--    evaluated once per query, not once per row.
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users read own profile"     ON profiles;
DROP POLICY IF EXISTS "Admins read all profiles"   ON profiles;

-- Single merged SELECT policy
CREATE POLICY "Read profiles"
  ON profiles FOR SELECT
  USING ((SELECT auth.uid()) = id OR (SELECT public.is_admin()));

-- Ensure the update policy also uses SELECT-wrapped auth.uid()
DROP POLICY IF EXISTS "Users update own profile" ON profiles;

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id);

-- ─────────────────────────────────────────────────────────────
-- 3. raffle_entries — fix auth_rls_initplan AND multiple_permissive_policies
--    Replace direct auth.uid() with (SELECT auth.uid()) so it
--    is evaluated once as an init-plan, and merge user/admin
--    SELECT policies into a single policy.
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can read own raffle entries" ON raffle_entries;
DROP POLICY IF EXISTS "Users read own raffle_entries"     ON raffle_entries;
DROP POLICY IF EXISTS "Admins read all raffle_entries"    ON raffle_entries;

CREATE POLICY "Read raffle_entries"
  ON raffle_entries FOR SELECT
  USING ((SELECT auth.uid()) = user_id OR (SELECT public.is_admin()));

-- ─────────────────────────────────────────────────────────────
-- 4. deals — fix multiple_permissive_policies
--    Merge the two permissive SELECT policies ("Public read active
--    deals" and "Admins read all deals") into a single policy so
--    the planner only needs to evaluate one policy per query.
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read active deals"  ON deals;
DROP POLICY IF EXISTS "Admins read all deals"     ON deals;

CREATE POLICY "Read deals"
  ON deals FOR SELECT
  USING (status = 'ACTIVE' OR (SELECT public.is_admin()));

-- ─────────────────────────────────────────────────────────────
-- 5. referrals — fix auth_rls_initplan AND multiple_permissive_policies
--    Merge permissive SELECT policies ("Users read own referrals"
--    and "Admins read all referrals") into a single policy and wrap
--    auth.uid() calls with (SELECT ...) so they are evaluated once
--    per query, not once per row.
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can read own referrals" ON referrals;
DROP POLICY IF EXISTS "Users read own referrals"     ON referrals;
DROP POLICY IF EXISTS "Admins read all referrals"    ON referrals;

CREATE POLICY "Read referrals"
  ON referrals FOR SELECT
  USING (
    (SELECT auth.uid()) = referrer_id
    OR (SELECT auth.uid()) = referee_id
    OR (SELECT public.is_admin())
  );
