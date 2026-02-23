# Dealflowhub

## Database Migrations

All Supabase migrations live in `supabase/migrations/`. Apply them in order.

### Running a migration

**Option A – Supabase Dashboard (recommended for hosted projects)**

1. Open your project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor → New query**.
3. Paste the contents of the migration file and click **Run**.

**Option B – Supabase CLI**

```bash
supabase db push
```

### Migration files

| File | Purpose |
|------|---------|
| `001_referral_system.sql` | Adds `ref_code` to profiles, creates `referrals` and `raffle_entries` tables, and the `redeem_referral` RPC. |
| `002_deals_table.sql` | Creates the `deals` table with the `category` column and handles migration from the legacy `cat` column name. Run this to fix deal-saving errors in the admin dashboard. |

> **Note:** `CREATE TABLE IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS` guards make every migration safe to re-run without causing errors.