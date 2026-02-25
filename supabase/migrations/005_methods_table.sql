-- ============================================================
-- Save & Earn Methods Table Migration
-- Run this in the Supabase SQL editor (Dashboard → SQL editor)
-- or apply via: supabase db push
-- ============================================================

-- 1. Create the methods table if it does not already exist.
--    Column names match the fromMethodDb/toMethodDb mappings in styles.js:
--      frontend .tabType        ↔  DB column  tab_type
--      frontend .potentialRange ↔  DB column  potential_range
--      frontend .order          ↔  DB column  sort_order
--      frontend .createdAt      ↔  DB column  created_at
CREATE TABLE IF NOT EXISTS methods (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT        NOT NULL,
  tab_type         TEXT        NOT NULL DEFAULT 'earn_more',
  summary          TEXT        NOT NULL DEFAULT '',
  description      TEXT        NOT NULL DEFAULT '',
  steps            TEXT[]      NOT NULL DEFAULT '{}',
  potential_range  TEXT        NOT NULL DEFAULT '',
  requirements     TEXT        NOT NULL DEFAULT '',
  tips             TEXT        NOT NULL DEFAULT '',
  links            TEXT[]      NOT NULL DEFAULT '{}',
  sort_order       INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security.
ALTER TABLE methods ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

--    Everyone can read methods.
DROP POLICY IF EXISTS "Public read methods" ON methods;
CREATE POLICY "Public read methods"
  ON methods FOR SELECT
  USING (true);

--    Only admins can insert methods.
DROP POLICY IF EXISTS "Admins insert methods" ON methods;
CREATE POLICY "Admins insert methods"
  ON methods FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

--    Only admins can update methods.
DROP POLICY IF EXISTS "Admins update methods" ON methods;
CREATE POLICY "Admins update methods"
  ON methods FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

--    Only admins can delete methods.
DROP POLICY IF EXISTS "Admins delete methods" ON methods;
CREATE POLICY "Admins delete methods"
  ON methods FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

-- 4. Seed the three built-in methods (skipped if the table already has rows).
INSERT INTO methods (title, tab_type, summary, description, steps, potential_range, requirements, tips, links, sort_order)
SELECT * FROM (VALUES
  (
    'Rakuten Cashback',
    'earn_more',
    'Earn cashback on purchases at 3,500+ stores.',
    'Rakuten (formerly Ebates) gives you a percentage of your purchase back as cash every quarter.',
    ARRAY['Sign up for a free Rakuten account','Install the Rakuten browser extension','Activate cashback before shopping at any participating store','Get paid via PayPal or check every quarter'],
    '$50–$500/year',
    'Free to join. Must activate before shopping.',
    'Stack with store sales and promo codes for maximum savings. Refer friends for bonus cashback.',
    ARRAY['https://www.rakuten.com'],
    0
  ),
  (
    'Ibotta Grocery Cashback',
    'earn_more',
    'Earn cashback on groceries at major supermarkets.',
    'Ibotta lets you earn cashback on groceries by selecting offers before you shop, then scanning your receipt.',
    ARRAY['Download the free Ibotta app','Browse and unlock offers before shopping','Shop at a participating store','Scan your receipt or link your loyalty card','Cash out via PayPal or gift card ($20 minimum)'],
    '$20–$150/month',
    'Smartphone required. Available at most US grocery chains.',
    'Check the app weekly — offers refresh. Combine with store sales.',
    ARRAY['https://home.ibotta.com'],
    1
  ),
  (
    'Use a Cashback Credit Card',
    'save_more',
    'Earn 1.5–5% back on every purchase automatically.',
    'Cashback credit cards give you a percentage of every purchase back, automatically. No activation needed per purchase.',
    ARRAY['Compare cashback credit cards (Chase Freedom, Discover it, Citi Double Cash, etc.)','Apply for a card that matches your spending habits','Use it for everyday purchases','Pay the balance in full each month to avoid interest','Redeem cashback as statement credit, direct deposit, or gift cards'],
    'Save 1.5–5% on all spending',
    'Good to excellent credit recommended. Must pay balance in full to benefit.',
    'Never carry a balance — interest charges will erase cashback gains.',
    ARRAY[]::TEXT[],
    0
  )
) AS seed(title, tab_type, summary, description, steps, potential_range, requirements, tips, links, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM methods LIMIT 1);
