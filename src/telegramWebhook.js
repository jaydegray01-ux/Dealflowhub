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
  if (!chatId || !text) return;

  await fetchImpl(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });
}

export function createTelegramWebhookHandler({
  fetchImpl = fetch,
  createSupabaseClient = (url, key) => createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }),
} = {}) {
  return async function handler(req, res) {
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
      res.status(500).json({ error: error.message });
      return;
    }

    const headerSecret = req.headers['x-telegram-bot-api-secret-token'];
    const querySecret = req.query?.secret;
    if (headerSecret !== webhookSecret && querySecret !== webhookSecret) {
      res.status(401).json({ error: 'Unauthorized webhook secret.' });
      return;
    }

    const text = getMessageText(req.body);
    const chatId = getChatId(req.body);

    if (!text || !chatId) {
      res.status(200).json({ ok: true, ignored: true });
      return;
    }

    const blocks = splitListingBlocks(text);
    if (!blocks.length) {
      await sendTelegramMessage({
        fetchImpl,
        botToken,
        chatId,
        text: 'No listing content found. Paste one or more listings separated with ===.',
      });
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
        results.push({ index: i + 1, title: deal.title || '(missing title)', ok: false, reason: validationErrors.join(' ') });
        continue;
      }

      const payload = toDbDeal(deal);
      const { error } = await supabase.from('deals').insert([payload]);

      if (error) {
        results.push({ index: i + 1, title: deal.title, ok: false, reason: error.message });
      } else {
        results.push({ index: i + 1, title: deal.title, ok: true });
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

    await sendTelegramMessage({
      fetchImpl,
      botToken,
      chatId,
      text: lines.join('\n'),
    });

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
