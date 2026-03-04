import test from 'node:test';
import assert from 'node:assert/strict';

import {
  extractAmazonAsin,
  canonicalAmazonUrl,
  affiliateAmazonUrl,
} from './amazonImport.js';
import { createAmazonImportHandler } from '../api/import/amazon.js';

function mockRes() {
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

test('extractAmazonAsin handles common Amazon URL formats', () => {
  assert.equal(extractAmazonAsin('https://www.amazon.com/dp/B08N5WRWNW'), 'B08N5WRWNW');
  assert.equal(extractAmazonAsin('https://www.amazon.com/gp/product/B08N5WRWNW/ref=ppx_yo_dt_b_asin_title_o00_s00'), 'B08N5WRWNW');
  assert.equal(extractAmazonAsin('https://smile.amazon.com/gp/aw/d/B08N5WRWNW?th=1'), 'B08N5WRWNW');
  assert.equal(extractAmazonAsin('https://www.amazon.com/Some-Name/dp/b08n5wrwnw/'), 'B08N5WRWNW');
  assert.equal(extractAmazonAsin('https://www.amazon.com/s?k=headphones&asin=B08N5WRWNW'), 'B08N5WRWNW');
  assert.equal(extractAmazonAsin('https://example.com/dp/B08N5WRWNW'), null);
  assert.equal(extractAmazonAsin('https://www.amazon.co.uk/dp/B08N5WRWNW'), 'B08N5WRWNW');
  assert.equal(extractAmazonAsin('https://www.amazon.de/dp/B08N5WRWNW'), 'B08N5WRWNW');
});

test('canonicalAmazonUrl + affiliateAmazonUrl produce expected URLs', () => {
  const canonical = canonicalAmazonUrl('b08n5wrwnw');
  assert.equal(canonical, 'https://www.amazon.com/dp/B08N5WRWNW');
  assert.equal(
    affiliateAmazonUrl(canonical, 'mytag-20'),
    'https://www.amazon.com/dp/B08N5WRWNW?tag=mytag-20',
  );
});

test('canonicalAmazonUrl preserves non-US Amazon marketplace TLD', () => {
  assert.equal(
    canonicalAmazonUrl('B08N5WRWNW', 'www.amazon.co.uk'),
    'https://www.amazon.co.uk/dp/B08N5WRWNW',
  );
  assert.equal(
    canonicalAmazonUrl('B08N5WRWNW', 'www.amazon.de'),
    'https://www.amazon.de/dp/B08N5WRWNW',
  );
  assert.equal(
    canonicalAmazonUrl('B08N5WRWNW', 'smile.amazon.co.jp'),
    'https://www.amazon.co.jp/dp/B08N5WRWNW',
  );
});

test('amazon import API parses mocked HTML and returns autofill payload', async () => {
  process.env.AMAZON_ASSOC_TAG = 'dealflowhub-20';

  const mockFetch = async () => ({
    ok: true,
    status: 200,
    async text() {
      return `
        <html><head>
          <meta property="og:title" content="Instant Pot Duo 7-in-1" />
          <meta property="og:image" content="https://images.example.com/instantpot.jpg" />
          <meta property="og:description" content="7-in-1 electric pressure cooker" />
        </head></html>
      `;
    },
  });

  const handler = createAmazonImportHandler({ fetchImpl: mockFetch });
  const req = {
    method: 'POST',
    body: { url: 'https://www.amazon.com/Instant-Pot-Duo/dp/B08N5WRWNW' },
  };
  const res = mockRes();

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.deal.asin, 'B08N5WRWNW');
  assert.equal(res.body.deal.title, 'Instant Pot Duo 7-in-1');
  assert.equal(res.body.deal.imageUrl, 'https://images.example.com/instantpot.jpg');
  assert.equal(res.body.deal.link, 'https://www.amazon.com/dp/B08N5WRWNW?tag=dealflowhub-20');
  assert.equal(res.body.deal.description, '7-in-1 electric pressure cooker');
});
