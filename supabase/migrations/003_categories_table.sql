-- ============================================================
-- Categories Table Migration
-- Run this in the Supabase SQL editor (Dashboard → SQL editor)
-- or apply via: supabase db push
-- ============================================================

-- 1. Create the categories table if it does not already exist.
CREATE TABLE IF NOT EXISTS categories (
  name TEXT PRIMARY KEY
);

-- 2. Remove every category that is NOT 'adult products'.
DELETE FROM categories
WHERE name <> 'adult products';

-- 3. Insert the full list of required categories.
--    ON CONFLICT DO NOTHING keeps the existing 'adult products' row intact.
INSERT INTO categories (name) VALUES
  ('adult products'),
  ('Electronics'),
  ('Beauty & personal care'),
  ('Baby'),
  ('Home & kitchen'),
  ('Arts and crafts'),
  ('Tools and home improvement'),
  ('Pet supplies'),
  ('Toys and games'),
  ('Health & household'),
  ('Automotive'),
  ('Clothing'),
  ('Sports & outdoors'),
  ('Other')
ON CONFLICT (name) DO NOTHING;
