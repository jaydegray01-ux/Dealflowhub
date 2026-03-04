-- Add Amazon ASIN support for deal import + dedupe.
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS asin TEXT;

CREATE INDEX IF NOT EXISTS deals_asin_idx ON deals (asin);

-- Enforce one deal per ASIN when value is present.
CREATE UNIQUE INDEX IF NOT EXISTS deals_asin_unique_idx
  ON deals (asin)
  WHERE asin IS NOT NULL;
