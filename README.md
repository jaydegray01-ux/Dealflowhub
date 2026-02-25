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

## Summary — what requires manual action

| Task | Manual? | Notes |
|---|---|---|
| Create Supabase project | ✅ Yes | One-time |
| Set env vars (`.env` or Vercel) | ✅ Yes | One-time |
| Run SQL migrations (000–005) | ✅ Yes | Paste each file into the SQL editor in order |
| Grant `role = 'ADMIN'` to your account | ✅ Yes | One SQL UPDATE per admin user |
| Configure Auth redirect URLs | ✅ Yes | See `docs/supabase-auth.md` |
| New users getting a profile row | 🤖 Automatic | The trigger in `000_profiles_table.sql` handles this |
| Save & Earn seed data | 🤖 Automatic | Inserted by `005_methods_table.sql` if the table is empty |
