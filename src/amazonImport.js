const AMAZON_HOST_RE = /^(?:[a-z0-9-]+\.)?amazon\.[a-z]{2,3}(?:\.[a-z]{2})?$/i;

const decodeEntities = (value = '') => value
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>');

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

export function canonicalAmazonUrl(asin, host = 'www.amazon.com') {
  if (!asin || !/^[A-Z0-9]{10}$/i.test(asin)) return null;
  const tldMatch = String(host).match(/^(?:[a-z0-9-]+\.)?amazon\.([a-z]{2,3}(?:\.[a-z]{2})?)$/i);
  const tld = tldMatch ? tldMatch[1] : 'com';
  return `https://www.amazon.${tld}/dp/${asin.toUpperCase()}`;
}

export function affiliateAmazonUrl(canonicalUrl, assocTag = '') {
  if (!canonicalUrl) return null;
  const tag = String(assocTag || '').trim();
  if (!tag) return canonicalUrl;
  return `${canonicalUrl}?tag=${encodeURIComponent(tag)}`;
}

export function parseAmazonProductHtml(html = '') {
  const safeHtml = String(html || '');

  const pick = (...patterns) => {
    for (const pattern of patterns) {
      const match = safeHtml.match(pattern);
      const value = match?.[1] ?? match?.[2];
      if (value) return decodeEntities(value.trim());
    }
    return '';
  };

  const title = pick(
    /<meta[^>]+property=["']og:title["'][^>]+content=(?:"([^"]+)"|'([^']+)')/i,
    /<meta[^>]+content=(?:"([^"]+)"|'([^']+)')[^>]+property=["']og:title["']/i,
    /<span[^>]+id=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i,
    /<title>([^<]+)<\/title>/i,
  ).replace(/\s+/g, ' ').trim();

  const imageUrl = pick(
    /<meta[^>]+property=["']og:image["'][^>]+content=(?:"([^"]+)"|'([^']+)')/i,
    /<meta[^>]+content=(?:"([^"]+)"|'([^']+)')[^>]+property=["']og:image["']/i,
    /<img[^>]+id=["']landingImage["'][^>]+src=(?:"([^"]+)"|'([^']+)')/i,
    /<img[^>]+src=(?:"([^"]+)"|'([^']+)')[^>]+id=["']landingImage["']/i,
  );

  const description = pick(
    /<meta[^>]+property=["']og:description["'][^>]+content=(?:"([^"]+)"|'([^']+)')/i,
    /<meta[^>]+content=(?:"([^"]+)"|'([^']+)')[^>]+property=["']og:description["']/i,
    /<meta[^>]+name=["']description["'][^>]+content=(?:"([^"]+)"|'([^']+)')/i,
    /<meta[^>]+content=(?:"([^"]+)"|'([^']+)')[^>]+name=["']description["']/i,
  );

  return {
    title,
    imageUrl,
    description: description || (title ? `Amazon deal: ${title}` : ''),
  };
}

export async function importAmazonFromUrl({ url, assocTag, fetchImpl = fetch }) {
  if (!url || typeof url !== 'string') {
    throw new Error('A valid Amazon URL is required.');
  }

  const asin = extractAmazonAsin(url);
  if (!asin) throw new Error('Could not extract a valid ASIN from that Amazon URL.');

  const parsedUrl = new URL(url);
  const canonicalUrl = canonicalAmazonUrl(asin, parsedUrl.hostname);
  const affiliateUrl = affiliateAmazonUrl(canonicalUrl, assocTag);

  const response = await fetchImpl(canonicalUrl, {
    method: 'GET',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; DealflowHubImportBot/1.0)',
      'accept-language': 'en-US,en;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error(`Amazon fetch failed with status ${response.status}.`);
  }

  const html = await response.text();
  const parsed = parseAmazonProductHtml(html);
  if (!parsed.title && !parsed.imageUrl) {
    throw new Error('Could not parse product title or image from Amazon page.');
  }

  return {
    asin,
    canonicalUrl,
    affiliateUrl,
    title: parsed.title,
    imageUrl: parsed.imageUrl,
    description: parsed.description,
  };
}
