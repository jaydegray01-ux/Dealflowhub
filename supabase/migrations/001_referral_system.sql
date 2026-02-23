-- ============================================================
-- Referral System Migration
-- Run this in the Supabase SQL editor or via supabase CLI.
-- ============================================================

-- 1. Add ref_code column to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ref_code TEXT UNIQUE;

-- Backfill existing profiles that don't have a ref_code
UPDATE profiles
SET ref_code = UPPER(SUBSTR(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8))
WHERE ref_code IS NULL;

-- 2. Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referee_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create raffle_entries table
CREATE TABLE IF NOT EXISTS raffle_entries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE referrals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE raffle_entries ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Users can read their own raffle entries
CREATE POLICY "Users read own raffle_entries"
  ON raffle_entries FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all raffle entries
CREATE POLICY "Admins read all raffle_entries"
  ON raffle_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

-- Users can read their own referrals (as referrer or referee)
CREATE POLICY "Users read own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- Admins can read all referrals
CREATE POLICY "Admins read all referrals"
  ON referrals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

-- 6. RPC: redeem_referral (SECURITY DEFINER to bypass RLS for inserts)
CREATE OR REPLACE FUNCTION redeem_referral(p_ref_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_referee_id  UUID := auth.uid();
BEGIN
  -- Caller must be authenticated
  IF v_referee_id IS NULL THEN
    RETURN 'unauthenticated';
  END IF;

  -- Find referrer by ref_code
  SELECT id INTO v_referrer_id
  FROM profiles
  WHERE ref_code = p_ref_code
  LIMIT 1;

  IF v_referrer_id IS NULL THEN
    RETURN 'invalid_code';
  END IF;

  -- Prevent self-referral
  IF v_referrer_id = v_referee_id THEN
    RETURN 'self_referral';
  END IF;

  -- Enforce one referral per referee (UNIQUE on referee_id handles this,
  -- but we check first to return a clear status)
  IF EXISTS (SELECT 1 FROM referrals WHERE referee_id = v_referee_id) THEN
    RETURN 'already_referred';
  END IF;

  -- Insert referral record
  INSERT INTO referrals (referrer_id, referee_id)
  VALUES (v_referrer_id, v_referee_id);

  -- Award +1 entry to referrer
  INSERT INTO raffle_entries (user_id, reason)
  VALUES (v_referrer_id, 'referrer_bonus');

  -- Award +1 entry to referee
  INSERT INTO raffle_entries (user_id, reason)
  VALUES (v_referee_id, 'referee_bonus');

  RETURN 'ok';
END;
$$;
