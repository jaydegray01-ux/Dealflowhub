import test from 'node:test';
import assert from 'node:assert/strict';
import { createTelegramWebhookHandler, _internal } from './telegramWebhook.js';

function makeRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('splitListingBlocks handles === separators and empty chunks', () => {
  const input = 'Title: One\n===\n\n\nTitle: Two\n===\n  \nTitle: Three';
  assert.deepEqual(_internal.splitListingBlocks(input), ['Title: One', 'Title: Two', 'Title: Three']);
});

test('telegram handler processes multiple listings and reports failures', async () => {
  process.env.TELEGRAM_BOT_TOKEN = 'token';
  process.env.TELEGRAM_WEBHOOK_SECRET = 'secret';
  process.env.SUPABASE_URL = 'https://supabase.example';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';

  const inserts = [];
  const fetchCalls = [];

  const handler = createTelegramWebhookHandler({
    fetchImpl: async (url, options) => {
      fetchCalls.push({ url, options });
      return { ok: true, json: async () => ({ ok: true }) };
    },
    createSupabaseClient: () => ({
      from() {
        return {
          insert(payload) {
            inserts.push(payload[0]);
            if (payload[0].title === 'Bad Promo') {
              return { error: { message: 'db rejected row' } };
            }
            return { error: null };
          },
        };
      },
    }),
  });

  const req = {
    method: 'POST',
    headers: { 'x-telegram-bot-api-secret-token': 'secret' },
    body: {
      message: {
        chat: { id: 12345 },
        text: [
          'Title: Good Sale',
          'Deal Type: SALE',
          'Product URL: https://example.com/sale',
          '===',
          'Title: Bad Promo',
          'Deal Type: PROMO',
          '===',
          'Title: Missing Stack',
          'Deal Type: STACKABLE',
        ].join('\n'),
      },
    },
    query: {},
  };

  const res = makeRes();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.created, 1);
  assert.equal(res.body.failed, 2);
  assert.equal(inserts.length, 1);
  assert.equal(fetchCalls.length, 1);
  assert.match(fetchCalls[0].options.body, /Batch processed: 3/);
});


test('telegram handler rejects batches over max listing limit', async () => {
  process.env.TELEGRAM_BOT_TOKEN = 'token';
  process.env.TELEGRAM_WEBHOOK_SECRET = 'secret';
  process.env.SUPABASE_URL = 'https://supabase.example';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';

  const inserts = [];
  const fetchCalls = [];

  const handler = createTelegramWebhookHandler({
    fetchImpl: async (url, options) => {
      fetchCalls.push({ url, options });
      return { ok: true, json: async () => ({ ok: true }) };
    },
    createSupabaseClient: () => ({
      from() {
        return {
          insert(payload) {
            inserts.push(payload[0]);
            return { error: null };
          },
        };
      },
    }),
  });

  const listings = Array.from({ length: _internal.MAX_LISTINGS_PER_BATCH + 1 }, (_, index) => [
    `Title: Listing ${index + 1}`,
    'Deal Type: SALE',
    `Product URL: https://example.com/${index + 1}`,
  ].join('\n')).join('\n===\n');

  const req = {
    method: 'POST',
    headers: { 'x-telegram-bot-api-secret-token': 'secret' },
    body: {
      message: {
        chat: { id: 12345 },
        text: listings,
      },
    },
    query: {},
  };

  const res = makeRes();
  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.processed, 0);
  assert.equal(res.body.created, 0);
  assert.equal(res.body.failed, 0);
  assert.equal(inserts.length, 0);
  assert.equal(fetchCalls.length, 1);
  assert.match(fetchCalls[0].options.body, /Maximum 25 listings per message\. You sent 26 listings\./);
});
