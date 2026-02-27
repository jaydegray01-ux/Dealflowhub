-- Add stackable metadata fields for deal-card rendering.
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS is_stackable BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS stack_options TEXT[] NOT NULL DEFAULT '{}'::text[];

-- Backfill values from existing deal_type semantics.
UPDATE deals
SET is_stackable = true
WHERE deal_type IN ('STACKABLE','BOTH')
  AND is_stackable = false;
