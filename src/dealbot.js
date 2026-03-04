const AMAZON_SHORTLINK_HOSTS = new Set(['amzn.to', 'a.co']);
const AMAZON_HOST_RE = /(^|\.)amazon\.[a-z.]+$/i;

export const DEALBOT_CATEGORY_VALUES = [
  'electronics',
  'home-and-kitchen',
  'clothing',
  'beauty-and-personal-care',
  'health-and-household',
  'tools-and-home-improvement',
  'baby',
  'toys-and-games',
  'sports-and-outdoors',
  'automotive',
  'pet-supplies',
  'arts-and-crafts',
  'other',
  'adult-products',
];

export function extractUrls(text = '') {
  return String(text).match(/https?:\/\/[^\s]+/g) || [];
}

export function extractAmazonAsin(rawUrl = '') {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }

  if (!AMAZON_HOST_RE.test(parsed.hostname)) return null;

  const path = parsed.pathname;
  const patterns = [
    /\/dp\/([A-Z0-9]{10})(?:[/?]|$)/i,
    /\/gp\/product\/([A-Z0-9]{10})(?:[/?]|$)/i,
    /\/gp\/aw\/d\/([A-Z0-9]{10})(?:[/?]|$)/i,
    /\/exec\/obidos\/ASIN\/([A-Z0-9]{10})(?:[/?]|$)/i,
    /\/product\/([A-Z0-9]{10})(?:[/?]|$)/i,
  ];

  for (const re of patterns) {
    const match = path.match(re);
    if (match?.[1]) return match[1].toUpperCase();
  }

  const asinFromParam = parsed.searchParams.get('asin');
  if (asinFromParam && /^[A-Z0-9]{10}$/i.test(asinFromParam)) {
    return asinFromParam.toUpperCase();
  }

  return null;
}

export async function resolveShortUrl(url, { fetchImpl = fetch, maxRedirects = 5, timeoutMs = 4000 } = {}) {
  let current = url;
  for (let i = 0; i < maxRedirects; i += 1) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      response = await fetchImpl(current, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'user-agent': 'DealFlowHubDealBot/1.0' },
      });
    } finally {
      clearTimeout(t);
    }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers?.get?.('location');
      if (!location) break;
      current = new URL(location, current).toString();
      continue;
    }
    break;
  }
  return current;
}

export async function normalizeAmazonUrl(inputUrl, opts = {}) {
  let workingUrl = inputUrl;
  let parsed = new URL(inputUrl);
  if (AMAZON_SHORTLINK_HOSTS.has(parsed.hostname.toLowerCase())) {
    workingUrl = await resolveShortUrl(inputUrl, opts);
    parsed = new URL(workingUrl);
  }

  const asin = extractAmazonAsin(workingUrl);
  if (!asin) throw new Error('Could not extract ASIN from URL.');

  const canonicalUrl = `https://www.amazon.com/dp/${asin}`;
  return { asin, canonicalUrl, finalUrl: workingUrl, finalHost: parsed.hostname };
}

export function buildAffiliateUrl(canonicalUrl, assocTag = '') {
  const url = new URL(canonicalUrl);
  if (assocTag?.trim()) {
    url.searchParams.set('tag', assocTag.trim());
  } else {
    url.searchParams.delete('tag');
  }
  return url.toString();
}

const decodeEntities = (value = '') => value
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>');

const pickHtml = (html, ...patterns) => {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    const value = match?.[1] ?? match?.[2];
    if (value) return decodeEntities(value.trim());
  }
  return '';
};

export function parseAmazonHtml(html = '') {
  const safe = String(html || '');
  return {
    title: pickHtml(
      safe,
      /<meta[^>]+property=["']og:title["'][^>]+content=(?:"([^"]+)"|'([^']+)')/i,
      /<meta[^>]+content=(?:"([^"]+)"|'([^']+)')[^>]+property=["']og:title["']/i,
      /<span[^>]+id=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i,
    ).replace(/\s+/g, ' ').trim(),
    imageUrl: pickHtml(
      safe,
      /<meta[^>]+property=["']og:image["'][^>]+content=(?:"([^"]+)"|'([^']+)')/i,
      /<meta[^>]+content=(?:"([^"]+)"|'([^']+)')[^>]+property=["']og:image["']/i,
      /<img[^>]+id=["']landingImage["'][^>]+src=(?:"([^"]+)"|'([^']+)')/i,
    ),
  };
}

export function generateDescription(title = '') {
  const cleaned = String(title || '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'Amazon deal found. Review details before publishing.';
  return `Amazon deal for ${cleaned}. Check current price and apply available discounts.`;
}

const CATEGORY_RULES = [
  ['adult-products', /adult|lube|vibrator|intimate|condom/i],
  ['electronics', /monitor|laptop|tablet|headphone|earbud|tv|camera|router|ssd|keyboard|mouse|speaker|charger|usb/i],
  ['home-and-kitchen', /kitchen|cookware|air fryer|vacuum|bedding|mattress|coffee|blender|storage/i],
  ['beauty-and-personal-care', /shampoo|conditioner|serum|makeup|skincare|lotion|beauty|razor/i],
  ['health-and-household', /vitamin|supplement|cleaner|detergent|toothpaste|health|household|medicine/i],
  ['tools-and-home-improvement', /drill|tool|wrench|screw|home improvement|ladder|sander/i],
  ['baby', /baby|diaper|stroller|infant|toddler|formula/i],
  ['toys-and-games', /toy|lego|puzzle|board game|doll|gaming/i],
  ['sports-and-outdoors', /bike|fitness|yoga|camp|hiking|sports|outdoor|dumbbell/i],
  ['automotive', /car |automotive|dash cam|jumper cable|motor oil|tire/i],
  ['pet-supplies', /pet|dog|cat|litter|aquarium|leash/i],
  ['arts-and-crafts', /craft|paint|canvas|marker|cricut|knit|sew/i],
  ['clothing', /shirt|jeans|jacket|shoe|sneaker|sock|hoodie|dress|clothing/i],
];

export function inferCategory(title = '', description = '') {
  const hay = `${title} ${description}`;
  for (const [cat, re] of CATEGORY_RULES) {
    if (re.test(hay)) return cat;
  }
  return 'other';
}

export function computeFeatured({ discountPct, currentPrice, existingFeatured = false }) {
  if (existingFeatured) return true;
  const pct = Number.isFinite(discountPct) ? discountPct : null;
  const price = Number.isFinite(currentPrice) ? currentPrice : null;
  if (pct != null && pct >= 40) return true;
  if (pct != null && pct >= 30 && price != null && price <= 25) return true;
  return false;
}

export function computeDiscountPct({ currentPrice, originalPrice, discountPct }) {
  if (Number.isFinite(discountPct)) return Math.round(discountPct);
  if (Number.isFinite(currentPrice) && Number.isFinite(originalPrice) && originalPrice > 0 && currentPrice <= originalPrice) {
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }
  return null;
}

export function telegramApiUrl(token, method) {
  return `https://api.telegram.org/bot${token}/${method}`;
}

export async function sendTelegramMessage({ token, chatId, text, replyToMessageId, fetchImpl = fetch }) {
  await fetchImpl(telegramApiUrl(token, 'sendMessage'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_to_message_id: replyToMessageId,
      disable_web_page_preview: false,
    }),
  });
}

export async function sendTelegramPhoto({ token, chatId, photoUrl, caption, replyToMessageId, fetchImpl = fetch }) {
  await fetchImpl(telegramApiUrl(token, 'sendPhoto'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl,
      caption,
      reply_to_message_id: replyToMessageId,
    }),
  });
}

export function extractTelegramPhoto(message) {
  const photos = message?.photo;
  if (!Array.isArray(photos) || !photos.length) return null;
  return photos[photos.length - 1];
}
