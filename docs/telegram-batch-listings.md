# Telegram Batch Listings Setup (Simple)

This guide lets your Telegram bot post **multiple listings in one message** into your DealflowHub site.

## 1) Add environment variables in Vercel

In your Vercel project → **Settings → Environment Variables**, add:

- `TELEGRAM_BOT_TOKEN` = token from BotFather
- `TELEGRAM_WEBHOOK_SECRET` = any long random string (example: generated password)
- `SUPABASE_URL` = your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` = your Supabase service role key

> Keep `SUPABASE_SERVICE_ROLE_KEY` private. Never share it in chat or frontend code.

## 2) Deploy to Vercel

Push this branch to GitHub and deploy.

## 2.5) Verify route location in this repo

The production Telegram webhook route is implemented at:

- `api/telegram/webhook.js` → serves `POST /api/telegram/webhook` on Vercel

The webhook function imports business logic from `src/telegramWebhook.js`.

## 3) Set Telegram webhook

After deploy, set webhook with your production URL:

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://<your-vercel-domain>/api/telegram/webhook",
    "secret_token": "<TELEGRAM_WEBHOOK_SECRET>"
  }'
```

## 4) Send a batch message to your bot

Use `===` between listings:

```text
Title: Listing One
Deal Type: SALE
Description: First listing
Product Image URL: https://example.com/image1.jpg
Product URL: https://example.com/deal1
Featured: false
Status: ACTIVE

===

Title: Listing Two
Deal Type: PROMO
Description: Second listing
Product Image URL: https://example.com/image2.jpg
Product URL: https://example.com/deal2
Promo Code: SAVE20
Featured: false
Status: ACTIVE
```

## 5) Expected result

The bot replies with:

- total processed
- succeeded count
- failed count
- per-listing failure reasons

## Notes

- The parser is tolerant of minor formatting differences in field labels.
- `Title` is required.
- For `PROMO` or `BOTH` listings, `Promo Code` is required.
- For stackable listings, stack instructions are required.
- `Product Image URL` is saved to `image_url`.
