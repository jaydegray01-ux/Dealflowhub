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

-- Drop all known SELECT policy names (live DB names and migration names)
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users read own profile"     ON profiles;
DROP POLICY IF EXISTS "admin_only"                 ON profiles;
DROP POLICY IF EXISTS "Admins read all profiles"   ON profiles;

-- Single merged SELECT policy
CREATE POLICY "Read profiles"
  ON profiles FOR SELECT
  USING ((SELECT auth.uid()) = id OR (SELECT public.is_admin()));

-- ─────────────────────────────────────────────────────────────
-- 3. raffle_entries — fix auth_rls_initplan
--    Replace direct auth.uid() with (SELECT auth.uid()) so it
--    is evaluated once as an init-plan.
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can read own raffle entries" ON raffle_entries;
DROP POLICY IF EXISTS "Users read own raffle_entries"     ON raffle_entries;

CREATE POLICY "Users read own raffle_entries"
  ON raffle_entries FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- ─────────────────────────────────────────────────────────────
-- 4. deals — fix multiple_permissive_policies
--    Merge the two permissive SELECT policies ("Public read active
--    deals" and "Admins read all deals") into a single policy so
--    the planner only needs to evaluate one policy per query.
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read active deals"  ON deals;
DROP POLICY IF EXISTS "Public can read active deals" ON deals;
DROP POLICY IF EXISTS "Admins read all deals"     ON deals;
DROP POLICY IF EXISTS "Admin can read all deals"  ON deals;

CREATE POLICY "Read deals"
  ON deals FOR SELECT
  USING (status = 'ACTIVE' OR (SELECT public.is_admin()));
