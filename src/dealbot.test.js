import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAffiliateUrl,
  computeFeatured,
  extractAmazonAsin,
  generateDescription,
  inferCategory,
  normalizeAmazonUrl,
  resolveShortUrl,
} from './dealbot.js';

test('extractAmazonAsin supports multiple url variants', () => {
  const cases = [
    ['https://www.amazon.com/dp/B08N5WRWNW', 'B08N5WRWNW'],
    ['https://amazon.com/gp/product/B08N5WRWNW', 'B08N5WRWNW'],
    ['https://www.amazon.com/gp/aw/d/B08N5WRWNW', 'B08N5WRWNW'],
    ['https://www.amazon.com/exec/obidos/ASIN/B08N5WRWNW', 'B08N5WRWNW'],
    ['https://www.amazon.com/product/B08N5WRWNW', 'B08N5WRWNW'],
    ['https://www.amazon.com/s?k=something&asin=B08N5WRWNW', 'B08N5WRWNW'],
    ['https://amazon.co.uk/dp/B08N5WRWNW', 'B08N5WRWNW'],
    ['https://smile.amazon.com/dp/b08n5wrwnw', 'B08N5WRWNW'],
    ['https://www.amazon.de/gp/product/B08N5WRWNW/ref=abc', 'B08N5WRWNW'],
    ['https://www.amazon.com/dp/B08N5WRWNW?tag=old-20', 'B08N5WRWNW'],
  ];

  for (const [url, expected] of cases) {
    assert.equal(extractAmazonAsin(url), expected);
  }
});

test('resolveShortUrl follows up to max redirects', async () => {
  const redirects = {
    'https://amzn.to/x': { status: 302, location: 'https://a.co/y' },
    'https://a.co/y': { status: 301, location: 'https://www.amazon.com/dp/B08N5WRWNW' },
    'https://www.amazon.com/dp/B08N5WRWNW': { status: 200 },
  };
  const fetchImpl = async (url) => ({
    status: redirects[url].status,
    headers: { get: (k) => (k === 'location' ? redirects[url].location : null) },
  });

  const finalUrl = await resolveShortUrl('https://amzn.to/x', { fetchImpl, maxRedirects: 5 });
  assert.equal(finalUrl, 'https://www.amazon.com/dp/B08N5WRWNW');
});

test('normalizeAmazonUrl resolves short links and canonicalizes', async () => {
  const fetchImpl = async () => ({
    status: 302,
    headers: { get: () => 'https://www.amazon.com/gp/product/B08N5WRWNW?tag=abc-20' },
  });
  const out = await normalizeAmazonUrl('https://amzn.to/abc', { fetchImpl, maxRedirects: 1 });
  assert.equal(out.asin, 'B08N5WRWNW');
  assert.equal(out.canonicalUrl, 'https://www.amazon.com/dp/B08N5WRWNW');
});

test('buildAffiliateUrl forces configured tag', () => {
  assert.equal(
    buildAffiliateUrl('https://www.amazon.com/dp/B08N5WRWNW?tag=wrong-20', 'right-20'),
    'https://www.amazon.com/dp/B08N5WRWNW?tag=right-20',
  );
});

test('generateDescription is deterministic', () => {
  assert.equal(
    generateDescription('Instant Pot Duo Plus'),
    'Amazon deal for Instant Pot Duo Plus. Check current price and apply available discounts.',
  );
});

test('inferCategory maps keywords to supported categories', () => {
  assert.equal(inferCategory('USB-C Charger', ''), 'electronics');
  assert.equal(inferCategory('Dog leash set', ''), 'pet-supplies');
  assert.equal(inferCategory('Unknown Item', ''), 'other');
});

test('featured rules', () => {
  assert.equal(computeFeatured({ discountPct: 40, currentPrice: 100 }), true);
  assert.equal(computeFeatured({ discountPct: 30, currentPrice: 25 }), true);
  assert.equal(computeFeatured({ discountPct: 30, currentPrice: 30 }), false);
  assert.equal(computeFeatured({ discountPct: 5, currentPrice: 10, existingFeatured: true }), true);
});
