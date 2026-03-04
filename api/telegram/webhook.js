import { createClient } from '@supabase/supabase-js';
import {
  buildAffiliateUrl,
  computeDiscountPct,
  computeFeatured,
  extractTelegramPhoto,
  extractUrls,
  generateDescription,
  inferCategory,
  normalizeAmazonUrl,
  parseAmazonHtml,
  sendTelegramMessage,
  sendTelegramPhoto,
  telegramApiUrl,
} from '../../src/dealbot.js';

function json(res, status, payload) {
  res.status(status).setHeader('content-type', 'application/json');
  res.end(JSON.stringify(payload));
}

function envRequired(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function createSupabase() {
  return createClient(envRequired('SUPABASE_URL'), envRequired('SUPABASE_SERVICE_ROLE_KEY'));
}

function sanitizeFileName(name = 'file.jpg') {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function uploadRemoteImageToStorage({ supabase, bucket, remoteUrl, path, fetchImpl = fetch }) {
  const response = await fetchImpl(remoteUrl, { headers: { 'user-agent': 'DealFlowHubDealBot/1.0' } });
  if (!response.ok) throw new Error('Could not download image.');
  const type = response.headers.get('content-type') || 'image/jpeg';
  const bytes = await response.arrayBuffer();
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, { contentType: type, upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function fetchAmazonDetails(canonicalUrl, fetchImpl = fetch) {
  const response = await fetchImpl(canonicalUrl, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; DealFlowHubDealBot/1.0)',
      'accept-language': 'en-US,en;q=0.9',
    },
  });
  if (!response.ok) throw new Error(`Amazon fetch failed with status ${response.status}`);
  const html = await response.text();
  return parseAmazonHtml(html);
}

async function findExistingDeal(supabase, asin, canonicalUrl) {
  if (asin) {
    const byAsin = await supabase.from('deals').select('id,title').eq('asin', asin).maybeSingle();
    if (byAsin.data) return byAsin.data;
  }
  const byCanonical = await supabase.from('deals').select('id,title').eq('canonical_url', canonicalUrl).maybeSingle();
  return byCanonical.data;
}

async function getTelegramFileUrl({ token, fileId, fetchImpl = fetch }) {
  const res = await fetchImpl(telegramApiUrl(token, 'getFile'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ file_id: fileId }),
  });
  const payload = await res.json();
  if (!payload.ok || !payload.result?.file_path) throw new Error('Could not fetch Telegram file path');
  return `https://api.telegram.org/file/bot${token}/${payload.result.file_path}`;
}

async function extractPricesWithVision(imageUrl, fetchImpl = fetch) {
  const schema = {
    type: 'object',
    properties: {
      current_price: { type: ['number', 'null'] },
      original_price: { type: ['number', 'null'] },
      discount_pct: { type: ['integer', 'null'] },
      confidence: { type: 'number' },
      notes: { type: 'string' },
    },
    required: ['current_price', 'original_price', 'discount_pct', 'confidence', 'notes'],
    additionalProperties: false,
  };

  const response = await fetchImpl('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${envRequired('OPENAI_API_KEY')}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      input: [{
        role: 'user',
        content: [
          { type: 'input_text', text: 'Extract price numbers from this screenshot. Return strict JSON.' },
          { type: 'input_image', image_url: imageUrl },
        ],
      }],
      text: {
        format: {
          type: 'json_schema',
          name: 'price_extract',
          schema,
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) throw new Error('OpenAI extraction failed');
  const body = await response.json();
  const content = body?.output?.[0]?.content || [];
  const jsonText = content.find((entry) => entry.type === 'output_text')?.text;
  if (!jsonText) throw new Error('OpenAI response missing JSON payload');
  return JSON.parse(jsonText);
}

async function handleLinkMessage({ message, supabase, token, assocTag, bucket, baseUrl, fetchImpl }) {
  const urls = extractUrls(message.text || '');
  if (!urls.length) {
    await sendTelegramMessage({ token, chatId: message.chat.id, text: 'Send an Amazon link to create a draft deal.', fetchImpl });
    return;
  }

  const { asin, canonicalUrl } = await normalizeAmazonUrl(urls[0], { fetchImpl });
  const existing = await findExistingDeal(supabase, asin, canonicalUrl);
  if (existing) {
    const dealUrl = `${baseUrl}/#deal?id=${existing.id}`;
    const adminUrl = `${baseUrl}/#admin`;
    await sendTelegramMessage({
      token,
      chatId: message.chat.id,
      replyToMessageId: message.message_id,
      text: `Already exists: ${existing.title}\nDeal: ${dealUrl}\nAdmin: ${adminUrl}`,
      fetchImpl,
    });
    return;
  }

  const affiliateUrl = buildAffiliateUrl(canonicalUrl, assocTag);
  const parsed = await fetchAmazonDetails(canonicalUrl, fetchImpl);
  const description = generateDescription(parsed.title);
  const category = inferCategory(parsed.title, description);

  let uploadedImageUrl = '';
  if (parsed.imageUrl) {
    const imagePath = `dealbot/products/${asin}-${Date.now()}.jpg`;
    uploadedImageUrl = await uploadRemoteImageToStorage({
      supabase,
      bucket,
      remoteUrl: parsed.imageUrl,
      path: imagePath,
      fetchImpl,
    });
  }

  const insertPayload = {
    title: parsed.title || `Amazon Deal ${asin}`,
    description,
    link: affiliateUrl,
    affiliate_url: affiliateUrl,
    canonical_url: canonicalUrl,
    asin,
    category,
    deal_type: 'SALE',
    code: '',
    status: 'INACTIVE',
    image_url: uploadedImageUrl,
    source_chat_id: String(message.chat.id),
    source_message_id: message.message_id,
  };

  const { data, error } = await supabase.from('deals').insert([insertPayload]).select('id,title').single();
  if (error) throw error;

  const summary = `Draft created: ${data.title}\n${affiliateUrl}\nCategory: ${category}\nSend a screenshot for price to finish.`;
  if (uploadedImageUrl) {
    await sendTelegramPhoto({ token, chatId: message.chat.id, photoUrl: uploadedImageUrl, caption: summary, replyToMessageId: message.message_id, fetchImpl });
  } else {
    await sendTelegramMessage({ token, chatId: message.chat.id, text: summary, replyToMessageId: message.message_id, fetchImpl });
  }
}

async function findDraftForPhoto({ supabase, message }) {
  if (message.reply_to_message?.message_id) {
    const byReply = await supabase
      .from('deals')
      .select('id,featured')
      .eq('source_chat_id', String(message.chat.id))
      .eq('source_message_id', message.reply_to_message.message_id)
      .eq('status', 'INACTIVE')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (byReply.data) return byReply.data;
  }

  const recent = await supabase
    .from('deals')
    .select('id,featured')
    .eq('source_chat_id', String(message.chat.id))
    .eq('status', 'INACTIVE')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return recent.data;
}

async function handlePhotoMessage({ message, supabase, token, bucket, fetchImpl }) {
  const draft = await findDraftForPhoto({ supabase, message });
  if (!draft) {
    await sendTelegramMessage({ token, chatId: message.chat.id, text: 'No matching draft found. Send a link first.', replyToMessageId: message.message_id, fetchImpl });
    return;
  }

  const photo = extractTelegramPhoto(message);
  if (!photo?.file_id) {
    await sendTelegramMessage({ token, chatId: message.chat.id, text: 'Could not read photo payload.', replyToMessageId: message.message_id, fetchImpl });
    return;
  }

  const telegramFileUrl = await getTelegramFileUrl({ token, fileId: photo.file_id, fetchImpl });
  const screenshotPath = `dealbot/screenshots/${draft.id}-${Date.now()}-${sanitizeFileName(photo.file_unique_id || 'photo')}.jpg`;
  const screenshotUrl = await uploadRemoteImageToStorage({
    supabase,
    bucket,
    remoteUrl: telegramFileUrl,
    path: screenshotPath,
    fetchImpl,
  });

  const extracted = await extractPricesWithVision(screenshotUrl, fetchImpl);
  const currentPrice = Number.isFinite(extracted.current_price) ? extracted.current_price : null;
  const originalPrice = Number.isFinite(extracted.original_price) ? extracted.original_price : null;
  const discountPct = computeDiscountPct({
    currentPrice,
    originalPrice,
    discountPct: Number.isFinite(extracted.discount_pct) ? extracted.discount_pct : null,
  });

  const featured = computeFeatured({
    discountPct,
    currentPrice,
    existingFeatured: draft.featured,
  });

  const confidence = Number(extracted.confidence || 0);
  const shouldPublish = confidence >= 0.75 && currentPrice != null;

  const updates = {
    current_price: currentPrice,
    original_price: originalPrice,
    percent_off: discountPct,
    featured,
    price_screenshot_url: screenshotUrl,
    ...(shouldPublish ? { status: 'ACTIVE' } : {}),
  };

  const { error } = await supabase.from('deals').update(updates).eq('id', draft.id);
  if (error) throw error;

  const reply = `Price extraction:\nCurrent: ${currentPrice ?? 'n/a'}\nOriginal: ${originalPrice ?? 'n/a'}\nDiscount: ${discountPct ?? 'n/a'}%\nConfidence: ${confidence.toFixed(2)}\nFeatured: ${featured ? 'yes' : 'no'}\nStatus: ${shouldPublish ? 'published' : 'draft'}`;

  await sendTelegramMessage({ token, chatId: message.chat.id, text: reply, replyToMessageId: message.message_id, fetchImpl });
}

export function createTelegramWebhookHandler({ fetchImpl = fetch, supabaseFactory = createSupabase } = {}) {
  return async function handler(req, res) {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

    const secretHeader = req.headers['x-telegram-bot-api-secret-token'];
    if (!secretHeader || secretHeader !== process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN) {
      return json(res, 401, { error: 'Unauthorized' });
    }

    try {
      const token = envRequired('TELEGRAM_BOT_TOKEN');
      const assocTag = envRequired('AMAZON_ASSOC_TAG');
      const bucket = envRequired('SUPABASE_STORAGE_BUCKET');
      const baseUrl = envRequired('PUBLIC_BASE_URL');
      const supabase = supabaseFactory();

      const message = req.body?.message;
      if (!message) return json(res, 200, { ok: true });

      if (message.text && extractUrls(message.text).length) {
        await handleLinkMessage({ message, supabase, token, assocTag, bucket, baseUrl, fetchImpl });
      } else if (message.photo) {
        await handlePhotoMessage({ message, supabase, token, bucket, fetchImpl });
      }

      return json(res, 200, { ok: true });
    } catch (error) {
      return json(res, 500, { error: error.message || 'Internal server error' });
    }
  };
}

export default createTelegramWebhookHandler();
