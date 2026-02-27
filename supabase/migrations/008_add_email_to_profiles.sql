-- ============================================================
-- Add email column to profiles table (if not already present)
-- Fixes: ERROR 42703 "column email does not exist" when
-- the profiles table was created before this column was added.
-- Also backfills email from auth.users for existing rows.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Backfill email for rows that were inserted before the column existed.
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND p.email IS NULL;
