-- DealBot fields for webhook ingest + dedupe + screenshot processing.
ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS canonical_url TEXT,
  ADD COLUMN IF NOT EXISTS affiliate_url TEXT,
  ADD COLUMN IF NOT EXISTS source_chat_id TEXT,
  ADD COLUMN IF NOT EXISTS source_message_id BIGINT,
  ADD COLUMN IF NOT EXISTS price_screenshot_url TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS deals_canonical_url_unique_idx
  ON deals (canonical_url)
  WHERE canonical_url IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS deals_asin_unique_idx
  ON deals (asin)
  WHERE asin IS NOT NULL;
