# Supabase Auth Configuration

This document describes the required Supabase Auth settings for Dealflowhub to work correctly with email confirmation enabled.

## Auth URL Configuration

In your [Supabase project dashboard](https://supabase.com/dashboard) go to **Authentication → URL Configuration** and set:

| Setting | Value |
|---|---|
| **Site URL** | `https://dealflowhub1.vercel.app` |
| **Redirect URLs** | `https://dealflowhub1.vercel.app/*` |

> **Why this matters:** When email confirmation is enabled, Supabase sends the user a confirmation link that redirects them back to the app. Setting the Site URL and Redirect URLs correctly ensures the confirmation link lands on the right page and that the resulting auth session is accepted by the app.

## Email Confirmation and Referral Redemption

With email confirmation enabled, `supabase.auth.signUp()` does **not** return an authenticated session immediately. The referral redemption flow accounts for this:

1. When a user visits `#/raffle?ref=<CODE>`, the referral code is saved to `localStorage` under the key `dfh_pending_ref`.
2. After the user signs up, they receive a confirmation email. No redemption is attempted yet.
3. After the user confirms their email and **logs in for the first time**, the app detects the `SIGNED_IN` auth event, checks that no referral row already exists for the user in the `referrals` table, and then calls `redeem_referral` with the pending code.
4. On a successful redemption (or any terminal outcome), the pending code is cleared and a per-user marker (`dfh_ref_attempted_for_user_<uid>`) is stored in `localStorage` to prevent duplicate attempts on subsequent logins. If a referral row is already present in the database (e.g. from a previous session on another device), the pending code is cleared immediately without calling the RPC.

### Terminal outcomes

| Condition / RPC response | Action |
|---|---|
| Referral row already exists in DB | Clear pending ref, set attempt marker |
| `ok` | Clear pending ref, set attempt marker, show success toast |
| `already_referred` | Clear pending ref, set attempt marker |
| `invalid_code` | Clear pending ref, set attempt marker |
| `self_referral` | Clear pending ref, set attempt marker |
| `unauthenticated` | Keep pending ref (retry on next `SIGNED_IN` event) |
| Network/server error (DB check or RPC) | Keep pending ref (retry on next `SIGNED_IN` event) |
