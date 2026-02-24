-- ============================================================
-- Price Fields Migration
-- Adds current_price, original_price, and percent_off to deals
-- ============================================================

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS current_price   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS original_price  NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS percent_off     NUMERIC(5,2);
