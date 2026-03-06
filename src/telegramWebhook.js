import { createClient } from '@supabase/supabase-js';
import { parseDealText } from './parser.js';
import {
  CATEGORIES,
  buildDealFromParsed,
  toDbDeal,
  validateDealForCreate,
} from './listingCreation.js';

function splitListingBlocks(raw = '') {
  return String(raw)
    .split(/\n\s*===+\s*\n/g)
    .map((block) => block.trim())
    .filter(Boolean);
}

function ensureEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function getMessageText(update = {}) {
  return update?.message?.text || update?.edited_message?.text || '';
}

function getChatId(update = {}) {
  return update?.message?.chat?.id || update?.edited_message?.chat?.id || null;
}

async function sendTelegramMessage({ fetchImpl, botToken, chatId, text }) {
  if (!chatId || !text) {
    return { ok: false, skipped: true, reason: 'missing chatId or text' };
  }

  try {
    const response = await fetchImpl(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    return {
      ok: !!response?.ok,
      status: response?.status ?? null,
      payload,
    };
  } catch (error) {
    return {
      ok: false,
      error: error?.message || String(error),
    };
  }
}

export function createTelegramWebhookHandler({
  fetchImpl = fetch,
  createSupabaseClient = (url, key) => createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }),
} = {}) {
  return async function handler(req, res) {
    console.log('[telegram webhook] webhook hit', {
      url: req.url,
      method: req.method,
    });

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    let botToken;
    let webhookSecret;
    let supabaseUrl;
    let serviceRoleKey;

    try {
      botToken = ensureEnv('TELEGRAM_BOT_TOKEN');
      webhookSecret = ensureEnv('TELEGRAM_WEBHOOK_SECRET');
      supabaseUrl = ensureEnv('SUPABASE_URL');
      serviceRoleKey = ensureEnv('SUPABASE_SERVICE_ROLE_KEY');
    } catch (error) {
      console.error('[telegram webhook] missing environment variable', {
        error: error.message,
      });
      res.status(500).json({ error: error.message });
      return;
    }

    const headerSecret = req.headers['x-telegram-bot-api-secret-token'];
    const secretMatches = headerSecret === webhookSecret;
    console.log('[telegram webhook] secret validation result', {
      hasHeader: Boolean(headerSecret),
      valid: secretMatches,
    });

    if (!secretMatches) {
      res.status(401).json({ error: 'Unauthorized webhook secret.' });
      return;
    }

    const update = req.body || {};
    const text = getMessageText(update);
    const chatId = getChatId(update);
    console.log('[telegram webhook] incoming Telegram update received', {
      hasMessage: Boolean(update?.message || update?.edited_message),
      chatId,
    });
    console.log('[telegram webhook] parsed message text', {
      hasText: Boolean(text),
      preview: text ? String(text).slice(0, 120) : '',
    });

    if (!text || !chatId) {
      res.status(200).json({ ok: true, ignored: true });
      return;
    }

    const blocks = splitListingBlocks(text);
    console.log('[telegram webhook] number of listing blocks found', {
      count: blocks.length,
    });

    if (!blocks.length) {
      const replyResult = await sendTelegramMessage({
        fetchImpl,
        botToken,
        chatId,
        text: 'No listing content found. Paste one or more listings separated with ===.',
      });
      console.log('[telegram webhook] Telegram reply result', replyResult);
      res.status(200).json({ ok: true, processed: 0, created: 0, failed: 0 });
      return;
    }

    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey);

    const results = [];
    for (let i = 0; i < blocks.length; i += 1) {
      const parsed = parseDealText(blocks[i], CATEGORIES);
      const deal = buildDealFromParsed(parsed);
      const validationErrors = validateDealForCreate(deal);

      if (validationErrors.length) {
        const failure = {
          index: i + 1,
          title: deal.title || '(missing title)',
          ok: false,
          reason: validationErrors.join(' '),
          source: 'validation',
        };
        results.push(failure);
        console.log('[telegram webhook] per-listing success/failure', failure);
        continue;
      }

      const payload = toDbDeal(deal);
      const { error } = await supabase.from('deals').insert([payload]);
      console.log('[telegram webhook] Supabase insert result', {
        index: i + 1,
        title: deal.title,
        ok: !error,
        error: error?.message || null,
      });

      if (error) {
        const failure = {
          index: i + 1,
          title: deal.title,
          ok: false,
          reason: error.message,
          source: 'database',
        };
        results.push(failure);
        console.log('[telegram webhook] per-listing success/failure', failure);
      } else {
        const success = { index: i + 1, title: deal.title, ok: true };
        results.push(success);
        console.log('[telegram webhook] per-listing success/failure', success);
      }
    }

    const succeeded = results.filter((r) => r.ok).length;
    const failed = results.length - succeeded;
    const lines = [
      `Batch processed: ${results.length}`,
      `✅ Succeeded: ${succeeded}`,
      `❌ Failed: ${failed}`,
    ];

    for (const result of results) {
      if (result.ok) lines.push(`• #${result.index}: ✅ ${result.title}`);
      else lines.push(`• #${result.index}: ❌ ${result.title} — ${result.reason}`);
    }

    const replyResult = await sendTelegramMessage({
      fetchImpl,
      botToken,
      chatId,
      text: lines.join('\n'),
    });
    console.log('[telegram webhook] Telegram reply result', replyResult);

    res.status(200).json({
      ok: true,
      processed: results.length,
      created: succeeded,
      failed,
      results,
    });
  };
}

export const _internal = {
  splitListingBlocks,
};
