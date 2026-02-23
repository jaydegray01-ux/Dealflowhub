-- ============================================================
-- Deals Table Migration
-- Run this in the Supabase SQL editor (Dashboard → SQL editor)
-- or apply via: supabase db push
-- ============================================================

-- 1. Create the deals table if it does not already exist.
--    Column names match the toDb/fromDb mappings in styles.js:
--      frontend .cat        ↔  DB column  category
--      frontend .dealType   ↔  DB column  deal_type
--      frontend .imageUrl   ↔  DB column  image_url
--      frontend .stackInstructions ↔ DB  stack_instructions
CREATE TABLE IF NOT EXISTS deals (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title              TEXT        NOT NULL,
  description        TEXT        NOT NULL DEFAULT '',
  link               TEXT        NOT NULL,
  deal_type          TEXT        NOT NULL DEFAULT 'SALE',
  code               TEXT        NOT NULL DEFAULT '',
  category           TEXT        NOT NULL DEFAULT 'other',
  clicks             INTEGER     NOT NULL DEFAULT 0,
  saved              INTEGER     NOT NULL DEFAULT 0,
  expires            DATE,
  featured           BOOLEAN     NOT NULL DEFAULT false,
  vote_up            INTEGER     NOT NULL DEFAULT 0,
  vote_down          INTEGER     NOT NULL DEFAULT 0,
  status             TEXT        NOT NULL DEFAULT 'ACTIVE',
  image_url          TEXT        NOT NULL DEFAULT '',
  stack_instructions TEXT        NOT NULL DEFAULT '',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. If the table already existed with the column named "cat" instead
--    of "category", rename it so the app can find it.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'deals'
      AND column_name  = 'cat'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'deals'
      AND column_name  = 'category'
  ) THEN
    ALTER TABLE deals RENAME COLUMN cat TO category;
  END IF;
END;
$$;

-- 3. If the table existed but has neither "cat" nor "category",
--    add the category column with a safe default.
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'other';

-- 4. Enable Row Level Security.
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
--    Everyone can read active deals.
CREATE POLICY IF NOT EXISTS "Public read active deals"
  ON deals FOR SELECT
  USING (status = 'ACTIVE');

--    Admins can read all deals (including inactive).
CREATE POLICY IF NOT EXISTS "Admins read all deals"
  ON deals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

--    Only admins can insert deals.
CREATE POLICY IF NOT EXISTS "Admins insert deals"
  ON deals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

--    Only admins can update deals.
CREATE POLICY IF NOT EXISTS "Admins update deals"
  ON deals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

--    Only admins can delete deals.
CREATE POLICY IF NOT EXISTS "Admins delete deals"
  ON deals FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );
