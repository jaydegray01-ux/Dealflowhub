-- ============================================================
-- Security Fixes Migration
-- Addresses Supabase Security Advisor warnings:
--   1. Enable RLS on the categories table
--   2. Fix SECURITY DEFINER functions with mutable search_path
--   3. Fix recursive admin RLS policies on profiles table
--   4. Add increment_deal_clicks RPC so anonymous users can
--      track clicks without requiring update permission on deals
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. is_admin() helper — SECURITY DEFINER with empty search_path
--    so it bypasses RLS on profiles and avoids recursive policies.
--    Must be created first because policies below depend on it.
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
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
$$;

-- ─────────────────────────────────────────────────────────────
-- 2. Enable RLS on categories (was missing entirely)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read categories" ON categories;
CREATE POLICY "Public read categories"
  ON categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins insert categories" ON categories;
CREATE POLICY "Admins insert categories"
  ON categories FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins update categories" ON categories;
CREATE POLICY "Admins update categories"
  ON categories FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins delete categories" ON categories;
CREATE POLICY "Admins delete categories"
  ON categories FOR DELETE
  USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- 3. Fix recursive admin policies on profiles
--    The old inline subquery queried profiles from within a
--    profiles policy — causing infinite recursion.
--    Replace with the is_admin() SECURITY DEFINER helper.
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins read all profiles" ON profiles;
CREATE POLICY "Admins read all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());

-- Also harden the other profile policies to use the helper
DROP POLICY IF EXISTS "Admins update all profiles" ON profiles;
CREATE POLICY "Admins update all profiles"
  ON profiles FOR UPDATE
  USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- 4. Replace inline admin subqueries on all other tables
--    with the is_admin() helper to be consistent and safe.
-- ─────────────────────────────────────────────────────────────

-- referrals
DROP POLICY IF EXISTS "Admins read all referrals" ON referrals;
CREATE POLICY "Admins read all referrals"
  ON referrals FOR SELECT
  USING (public.is_admin());

-- raffle_entries
DROP POLICY IF EXISTS "Admins read all raffle_entries" ON raffle_entries;
CREATE POLICY "Admins read all raffle_entries"
  ON raffle_entries FOR SELECT
  USING (public.is_admin());

-- deals
DROP POLICY IF EXISTS "Admins read all deals" ON deals;
CREATE POLICY "Admins read all deals"
  ON deals FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins insert deals" ON deals;
CREATE POLICY "Admins insert deals"
  ON deals FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins update deals" ON deals;
CREATE POLICY "Admins update deals"
  ON deals FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins delete deals" ON deals;
CREATE POLICY "Admins delete deals"
  ON deals FOR DELETE
  USING (public.is_admin());

-- methods
DROP POLICY IF EXISTS "Admins insert methods" ON methods;
CREATE POLICY "Admins insert methods"
  ON methods FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins update methods" ON methods;
CREATE POLICY "Admins update methods"
  ON methods FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins delete methods" ON methods;
CREATE POLICY "Admins delete methods"
  ON methods FOR DELETE
  USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- 5. Fix handle_new_user — change search_path from 'public'
--    to '' and qualify all references.  This removes the
--    mutable search_path security warning.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 6. Fix redeem_referral — same search_path hardening.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.redeem_referral(p_ref_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_referrer_id UUID;
  v_referee_id  UUID := auth.uid();
BEGIN
  IF v_referee_id IS NULL THEN
    RETURN 'unauthenticated';
  END IF;

  SELECT id INTO v_referrer_id
  FROM public.profiles
  WHERE ref_code = p_ref_code
  LIMIT 1;

  IF v_referrer_id IS NULL THEN
    RETURN 'invalid_code';
  END IF;

  IF v_referrer_id = v_referee_id THEN
    RETURN 'self_referral';
  END IF;

  IF EXISTS (SELECT 1 FROM public.referrals WHERE referee_id = v_referee_id) THEN
    RETURN 'already_referred';
  END IF;

  INSERT INTO public.referrals (referrer_id, referee_id)
  VALUES (v_referrer_id, v_referee_id);

  INSERT INTO public.raffle_entries (user_id, reason)
  VALUES (v_referrer_id, 'referrer_bonus');

  INSERT INTO public.raffle_entries (user_id, reason)
  VALUES (v_referee_id, 'referee_bonus');

  RETURN 'ok';
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 7. increment_deal_clicks — allows any visitor (including
--    anonymous) to atomically increment the click counter on
--    a deal without needing UPDATE permission on the deals table.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_deal_clicks(p_deal_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.deals
  SET clicks = clicks + 1
  WHERE id = p_deal_id;
END;
$$;
