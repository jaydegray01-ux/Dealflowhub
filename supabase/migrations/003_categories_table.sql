-- ============================================================
-- Categories Table – Cleanup & Seed
-- Run this in the Supabase SQL editor (Dashboard → SQL editor)
-- or apply via: supabase db push
--
-- What this script does:
--   1. Creates the categories table if it does not exist.
--   2. Deletes every row except 'adult-products'
--      (safe to run even if adult-products is absent).
--   3. Upserts the canonical category set using ON CONFLICT DO UPDATE
--      so re-running is idempotent and keeps labels/emoji in sync.
-- ============================================================

-- 1. Create the categories table if it does not already exist.
CREATE TABLE IF NOT EXISTS categories (
  id         TEXT        PRIMARY KEY,
  label      TEXT        NOT NULL,
  emoji      TEXT        NOT NULL DEFAULT '',
  adult      BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Remove every category except adult-products.
--    If adult-products does not exist this still succeeds (0 rows deleted).
DELETE FROM categories
WHERE id <> 'adult-products';

-- 3. Upsert the full canonical list.
--    adult-products is included here so it is created when absent.
INSERT INTO categories (id, label, emoji, adult) VALUES
  ('electronics',                'Electronics',               '📱', false),
  ('beauty',                     'Beauty & Personal Care',    '💄', false),
  ('baby',                       'Baby',                      '👶', false),
  ('home-and-kitchen',           'Home & Kitchen',            '🏠', false),
  ('arts-and-crafts',            'Arts and Crafts',           '🎨', false),
  ('tools-and-home-improvement', 'Tools and Home Improvement','🔧', false),
  ('pet-supplies',               'Pet Supplies',              '🐾', false),
  ('toys-and-games',             'Toys and Games',            '🎮', false),
  ('health-and-household',       'Health & Household',        '💊', false),
  ('automotive',                 'Automotive',                '🚗', false),
  ('clothing',                   'Clothing',                  '👕', false),
  ('sports-and-outdoors',        'Sports & Outdoors',         '⛺', false),
  ('other',                      'Other',                     '🏷️', false),
  ('adult-products',             'Adult Products',            '🔞', true)
ON CONFLICT (id) DO UPDATE
  SET label = EXCLUDED.label,
      emoji = EXCLUDED.emoji,
      adult = EXCLUDED.adult;

-- 4. Verify – run a quick SELECT to confirm the final state.
-- SELECT id, label, adult FROM categories ORDER BY adult, id;
