import test from 'node:test';
import assert from 'node:assert/strict';

function makeRes() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    status(code) { this.statusCode = code; return this; },
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    end(payload) { this.body = payload; },
  };
}

function makeSupabaseForLink() {
  const state = { inserted: null };
  const deals = {
    select() {
      return {
        eq() { return { maybeSingle: async () => ({ data: null }) }; },
      };
    },
    insert(payload) {
      state.inserted = payload[0];
      return {
        select() { return { single: async () => ({ data: { id: 'deal-1', title: payload[0].title }, error: null }) }; },
      };
    },
  };

  return {
    state,
    client: {
      from(table) {
        if (table === 'deals') return deals;
        throw new Error(`Unexpected table ${table}`);
      },
      storage: {
        from() {
          return {
            upload: async () => ({ error: null }),
            getPublicUrl: (p) => ({ data: { publicUrl: `https://cdn.example/${p}` } }),
          };
        },
      },
    },
  };
}

function makeSupabaseForPhoto() {
  const state = { updated: null };
  return {
    state,
    client: {
      from() {
        return {
          select() {
            return {
              eq() { return this; },
              order() { return this; },
              limit() { return this; },
              maybeSingle: async () => ({ data: { id: 'deal-2', featured: false } }),
            };
          },
          update(payload) {
            state.updated = payload;
            return { eq: async () => ({ error: null }) };
          },
        };
      },
      storage: {
        from() {
          return {
            upload: async () => ({ error: null }),
            getPublicUrl: (p) => ({ data: { publicUrl: `https://cdn.example/${p}` } }),
          };
        },
      },
    },
  };
}

const ENV_KEYS = [
  'TELEGRAM_WEBHOOK_SECRET_TOKEN',
  'TELEGRAM_BOT_TOKEN',
  'AMAZON_ASSOC_TAG',
  'SUPABASE_STORAGE_BUCKET',
  'PUBLIC_BASE_URL',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
];

function snapshotEnv() {
  return Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
}

function restoreEnv(snapshot) {
  for (const [key, value] of Object.entries(snapshot)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

test('webhook link message path inserts draft', async () => {
  const { createTelegramWebhookHandler } = await import('../api/telegram/webhook.js');
  const supabaseWrap = makeSupabaseForLink();

  const prevEnv = snapshotEnv();
  try {
    process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN = 'secret';
    process.env.TELEGRAM_BOT_TOKEN = 'token';
    process.env.AMAZON_ASSOC_TAG = 'tag-20';
    process.env.SUPABASE_STORAGE_BUCKET = 'deal-images';
    process.env.PUBLIC_BASE_URL = 'https://dealflowhub.example';
    process.env.SUPABASE_URL = 'https://supabase.example';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
    process.env.OPENAI_API_KEY = 'x';

    const fetchImpl = async (url) => {
      const u = String(url);
      if (u.includes('amazon.com/dp/')) {
        return {
          ok: true,
          text: async () => '<meta property="og:title" content="USB Charger" /><meta property="og:image" content="https://img.example/p.jpg" />',
        };
      }
      if (u.includes('img.example')) {
        return { ok: true, headers: { get: () => 'image/jpeg' }, arrayBuffer: async () => new Uint8Array([1]).buffer };
      }
      if (u.includes('sendPhoto') || u.includes('sendMessage')) {
        return { ok: true, json: async () => ({ ok: true }) };
      }
      throw new Error(`Unexpected fetch url ${u}`);
    };

    const handler = createTelegramWebhookHandler({ fetchImpl, supabaseFactory: () => supabaseWrap.client });
    const req = {
      method: 'POST',
      headers: { 'x-telegram-bot-api-secret-token': 'secret' },
      body: { message: { message_id: 12, chat: { id: 99 }, text: 'https://www.amazon.com/dp/B08N5WRWNW' } },
    };
    const res = makeRes();
    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(supabaseWrap.state.inserted.asin, 'B08N5WRWNW');
    assert.equal(supabaseWrap.state.inserted.status, 'INACTIVE');
    assert.equal(supabaseWrap.state.inserted.category, 'electronics');
  } finally {
    restoreEnv(prevEnv);
  }
});

test('webhook photo message path updates prices', async () => {
  const { createTelegramWebhookHandler } = await import('../api/telegram/webhook.js');
  const supabaseWrap = makeSupabaseForPhoto();

  const prevEnv = snapshotEnv();
  try {
    process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN = 'secret';
    process.env.TELEGRAM_BOT_TOKEN = 'token';
    process.env.AMAZON_ASSOC_TAG = 'tag-20';
    process.env.SUPABASE_STORAGE_BUCKET = 'deal-images';
    process.env.PUBLIC_BASE_URL = 'https://dealflowhub.example';
    process.env.SUPABASE_URL = 'https://supabase.example';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service';
    process.env.OPENAI_API_KEY = 'openai';

    const fetchImpl = async (url) => {
      const u = String(url);
      if (u.includes('/getFile')) {
        return { ok: true, json: async () => ({ ok: true, result: { file_path: 'photos/a.jpg' } }) };
      }
      if (u.includes('/file/bottoken/photos/a.jpg')) {
        return { ok: true, headers: { get: () => 'image/jpeg' }, arrayBuffer: async () => new Uint8Array([1]).buffer };
      }
      if (u === 'https://api.openai.com/v1/responses') {
        return {
          ok: true,
          json: async () => ({ output: [{ content: [{ type: 'output_text', text: JSON.stringify({ current_price: 19.99, original_price: 49.99, discount_pct: null, confidence: 0.9, notes: 'clear' }) }] }] }),
        };
      }
      if (u.includes('sendMessage')) return { ok: true, json: async () => ({ ok: true }) };
      throw new Error(`Unexpected fetch ${u}`);
    };

    const handler = createTelegramWebhookHandler({ fetchImpl, supabaseFactory: () => supabaseWrap.client });
    const req = {
      method: 'POST',
      headers: { 'x-telegram-bot-api-secret-token': 'secret' },
      body: { message: { message_id: 99, chat: { id: 9 }, photo: [{ file_id: '1', file_unique_id: 'uniq' }] } },
    };
    const res = makeRes();
    await handler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(supabaseWrap.state.updated.status, 'ACTIVE');
    assert.equal(supabaseWrap.state.updated.featured, true);
    assert.equal(supabaseWrap.state.updated.percent_off, 60);
  } finally {
    restoreEnv(prevEnv);
  }
});
