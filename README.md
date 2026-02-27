# Dealflowhub

## Complete Setup Guide

Follow these steps **in order** the first time you set up the project.

---

### Step 1 — Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and click **New project**.
2. Choose a name, database password, and region.
3. Wait for the project to finish provisioning (~1 minute).

---

### Step 2 — Add environment variables

Copy `.env.example` to `.env` and fill in your project credentials:

```bash
cp .env.example .env
```

| Variable | Where to find it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Dashboard → **Settings → API** → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → **Settings → API** → `anon` public key |

If you are deploying to **Vercel**, add both variables in **Vercel → Project → Settings → Environment Variables** instead of a `.env` file.

---

### Step 3 — Run database migrations

Open the **SQL Editor** in your Supabase Dashboard (**SQL Editor → New query**), then paste and run each file below **in order**:

| # | File | What it does |
|---|------|-------------|
| 0 | `supabase/migrations/000_profiles_table.sql` | **Run first.** Creates the `profiles` table and the auth trigger that auto-creates a profile whenever a user signs up. All other migrations depend on this. |
| 1 | `supabase/migrations/001_referral_system.sql` | Adds `ref_code` to profiles, creates the `referrals` and `raffle_entries` tables, and the `redeem_referral` RPC. |
| 2 | `supabase/migrations/002_deals_table.sql` | Creates the `deals` table. |
| 3 | `supabase/migrations/003_categories_table.sql` | Creates and seeds the `categories` table. |
| 4 | `supabase/migrations/004_price_fields.sql` | Adds `current_price`, `original_price`, and `percent_off` columns to `deals`. |
| 5 | `supabase/migrations/005_methods_table.sql` | Creates the `methods` table (Save & Earn) and seeds the three built-in methods. |
| 6 | `supabase/migrations/006_security_fixes.sql` | Adds the `is_admin()` helper function, enables RLS on `categories`, fixes recursive admin policies, and adds the `increment_deal_clicks` RPC. |
| 7 | `supabase/migrations/007_performance_fixes.sql` | Optimises the `is_admin()` function and merges duplicate permissive SELECT policies on `profiles`, `deals`, `referrals`, and `raffle_entries`. |
| 8 | `supabase/migrations/008_add_email_to_profiles.sql` | Adds the `email` column to `profiles` (if missing) and backfills it from `auth.users`. **Required for the Admin Dashboard to look up users by email.** |

> **Tip:** Every migration is safe to re-run — `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, and `DROP POLICY IF EXISTS` guards prevent duplicate-object errors.

Alternatively, if you have the **Supabase CLI** installed:

```bash
supabase db push
```

#### Or paste the complete schema in one shot

Open **SQL Editor → New query** in your Supabase Dashboard, paste the block below in full, and click **Run**. It is exactly all migrations 000–008 concatenated in order and is safe to run on a fresh database or re-run on an existing one.

```sql
-- ============================================================
-- Dealflowhub — Complete Schema (migrations 000–008)
-- Paste this entire block into the Supabase SQL Editor and run.
-- Every statement is idempotent — safe to re-run at any time.
-- ============================================================


-- ============================================================
-- 000 — Profiles Table
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT,
  role       TEXT NOT NULL DEFAULT 'USER',
  ref_code   TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile" ON profiles;
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins read all profiles" ON profiles;
CREATE POLICY "Admins read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'ADMIN'
    )
  );

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 001 — Referral System
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ref_code TEXT UNIQUE;

UPDATE profiles
SET ref_code = UPPER(SUBSTR(REPLACE(gen_random_uuid()::text, '-', ''), 1, 8))
WHERE ref_code IS NULL;

CREATE TABLE IF NOT EXISTS referrals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referee_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS raffle_entries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE referrals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE raffle_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own raffle_entries" ON raffle_entries;
CREATE POLICY "Users read own raffle_entries"
  ON raffle_entries FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read all raffle_entries" ON raffle_entries;
CREATE POLICY "Admins read all raffle_entries"
  ON raffle_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "Users read own referrals" ON referrals;
CREATE POLICY "Users read own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

DROP POLICY IF EXISTS "Admins read all referrals" ON referrals;
CREATE POLICY "Admins read all referrals"
  ON referrals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

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
  IF v_referee_id IS NULL THEN
    RETURN 'unauthenticated';
  END IF;

  SELECT id INTO v_referrer_id
  FROM profiles
  WHERE ref_code = p_ref_code
  LIMIT 1;

  IF v_referrer_id IS NULL THEN
    RETURN 'invalid_code';
  END IF;

  IF v_referrer_id = v_referee_id THEN
    RETURN 'self_referral';
  END IF;

  IF EXISTS (SELECT 1 FROM referrals WHERE referee_id = v_referee_id) THEN
    RETURN 'already_referred';
  END IF;

  INSERT INTO referrals (referrer_id, referee_id)
  VALUES (v_referrer_id, v_referee_id);

  INSERT INTO raffle_entries (user_id, reason)
  VALUES (v_referrer_id, 'referrer_bonus');

  INSERT INTO raffle_entries (user_id, reason)
  VALUES (v_referee_id, 'referee_bonus');

  RETURN 'ok';
END;
$$;


-- ============================================================
-- 002 — Deals Table
-- ============================================================

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

ALTER TABLE deals ADD COLUMN IF NOT EXISTS category           TEXT NOT NULL DEFAULT 'other';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS image_url          TEXT NOT NULL DEFAULT '';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS stack_instructions TEXT NOT NULL DEFAULT '';

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active deals" ON deals;
CREATE POLICY "Public read active deals"
  ON deals FOR SELECT
  USING (status = 'ACTIVE');

DROP POLICY IF EXISTS "Admins read all deals" ON deals;
CREATE POLICY "Admins read all deals"
  ON deals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "Admins insert deals" ON deals;
CREATE POLICY "Admins insert deals"
  ON deals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "Admins update deals" ON deals;
CREATE POLICY "Admins update deals"
  ON deals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "Admins delete deals" ON deals;
CREATE POLICY "Admins delete deals"
  ON deals FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'ADMIN'
    )
  );


-- ============================================================
-- 003 — Categories Table
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
  name TEXT PRIMARY KEY
);

DELETE FROM categories
WHERE name <> 'adult products';

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


-- ============================================================
-- 004 — Price Fields
-- ============================================================

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS current_price   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS original_price  NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS percent_off     NUMERIC(5,2);


-- ============================================================
-- 005 — Methods Table (Save & Earn)
-- ============================================================

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

ALTER TABLE methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read methods" ON methods;
CREATE POLICY "Public read methods"
  ON methods FOR SELECT
  USING (true);

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


-- ============================================================
-- 006 — Security Fixes
-- ============================================================

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

DROP POLICY IF EXISTS "Admins read all profiles" ON profiles;
CREATE POLICY "Admins read all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins update all profiles" ON profiles;
CREATE POLICY "Admins update all profiles"
  ON profiles FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins read all referrals" ON referrals;
CREATE POLICY "Admins read all referrals"
  ON referrals FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins read all raffle_entries" ON raffle_entries;
CREATE POLICY "Admins read all raffle_entries"
  ON raffle_entries FOR SELECT
  USING (public.is_admin());

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


-- ============================================================
-- 007 — Performance Fixes
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'ADMIN'
  )
$$;

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users read own profile"     ON profiles;
DROP POLICY IF EXISTS "Admins read all profiles"   ON profiles;

CREATE POLICY "Read profiles"
  ON profiles FOR SELECT
  USING ((SELECT auth.uid()) = id OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Users update own profile" ON profiles;

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can read own raffle entries" ON raffle_entries;
DROP POLICY IF EXISTS "Users read own raffle_entries"     ON raffle_entries;
DROP POLICY IF EXISTS "Admins read all raffle_entries"    ON raffle_entries;

CREATE POLICY "Read raffle_entries"
  ON raffle_entries FOR SELECT
  USING ((SELECT auth.uid()) = user_id OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Public read active deals"  ON deals;
DROP POLICY IF EXISTS "Admins read all deals"     ON deals;

CREATE POLICY "Read deals"
  ON deals FOR SELECT
  USING (status = 'ACTIVE' OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS "Users can read own referrals" ON referrals;
DROP POLICY IF EXISTS "Users read own referrals"     ON referrals;
DROP POLICY IF EXISTS "Admins read all referrals"    ON referrals;

CREATE POLICY "Read referrals"
  ON referrals FOR SELECT
  USING (
    (SELECT auth.uid()) = referrer_id
    OR (SELECT auth.uid()) = referee_id
    OR (SELECT public.is_admin())
  );


-- ============================================================
-- 008 — Add email column to profiles (backfill from auth.users)
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND p.email IS NULL;
```

---

### Step 4 — Grant yourself Admin access

The Admin Dashboard is only visible to accounts with `role = 'ADMIN'` in the `profiles` table.

1. Sign up (or log in) to the app with your admin email address.
2. In the Supabase Dashboard go to **SQL Editor → New query** and run:

```sql
UPDATE profiles
SET role = 'ADMIN'
WHERE email = 'you@example.com';
```

Replace `you@example.com` with your actual email. You only need to do this once.

> **Tip:** If you see an error like `column "email" does not exist`, run migration
> `008_add_email_to_profiles.sql` first (see the `supabase/migrations/` folder).
> Alternatively, look up your user UUID in **Authentication → Users** and run:
>
> ```sql
> UPDATE profiles
> SET role = 'ADMIN'
> WHERE id = 'your-user-uuid';
> ```

---

### Step 5 — Configure Auth redirect URLs

See [`docs/supabase-auth.md`](docs/supabase-auth.md) for the required **Site URL** and **Redirect URL** settings. This is needed for email confirmation links to redirect back to the correct page.

---

### Step 6 — Run the app locally

```bash
npm install
npm run dev
```

---

## Troubleshooting

### Error: "Could not find the table 'public.methods' in the schema cache"

This means one or more migrations have not been applied to your Supabase project yet.

**Fix:** Paste the complete schema block from [Step 3 above](#step-3--run-database-migrations) into the **Supabase Dashboard → SQL Editor → New query** and click **Run**. Every statement is idempotent — it is safe to run even if some migrations were applied previously.

---

## Summary — what requires manual action

| Task | Manual? | Notes |
|---|---|---|
| Create Supabase project | ✅ Yes | One-time |
| Set env vars (`.env` or Vercel) | ✅ Yes | One-time |
| Run SQL migrations (000–008) | ✅ Yes | Paste each file into the SQL editor in order |
| Grant `role = 'ADMIN'` to your account | ✅ Yes | One SQL UPDATE per admin user — see Step 4 |
| Configure Auth redirect URLs | ✅ Yes | See `docs/supabase-auth.md` |
| New users getting a profile row | 🤖 Automatic | The trigger in `000_profiles_table.sql` handles this |
| Save & Earn seed data | 🤖 Automatic | Inserted by `005_methods_table.sql` if the table is empty |
