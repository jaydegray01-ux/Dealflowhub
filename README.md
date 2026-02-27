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

This means migration `005_methods_table.sql` has not been applied to your Supabase project yet.

**Fix:** Open the **Supabase Dashboard → SQL Editor → New query**, paste the SQL below in full, and click **Run**.

```sql
-- ============================================================
-- Save & Earn Methods Table Migration
-- ============================================================

-- 1. Create the methods table if it does not already exist.
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
```

This is identical to `supabase/migrations/005_methods_table.sql`. It is safe to run more than once — all statements are idempotent.

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
