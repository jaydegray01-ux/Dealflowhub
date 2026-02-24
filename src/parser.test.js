/**
 * Minimal self-check for parseDealText.
 * Run with:  node --experimental-vm-modules src/parser.test.js
 * (No external test framework needed – uses Node's built-in assert module.)
 */
import assert from 'node:assert/strict';
import { parseDealText } from './parser.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

// ── Existing fields ───────────────────────────────────────────
test('parses title from plaintext', () => {
  const r = parseDealText('Title: My Deal');
  assert.equal(r.title, 'My Deal');
});

test('parses dealType from plaintext', () => {
  const r = parseDealText('Deal Type: SALE');
  assert.equal(r.dealType, 'SALE');
});

test('parses imageUrl alias "image"', () => {
  const r = parseDealText('image: https://example.com/img.jpg');
  assert.equal(r.imageUrl, 'https://example.com/img.jpg');
});

test('parses link alias "url"', () => {
  const r = parseDealText('url: https://example.com/product');
  assert.equal(r.link, 'https://example.com/product');
});

test('parses code alias "promo"', () => {
  const r = parseDealText('promo: SAVE10');
  assert.equal(r.code, 'SAVE10');
});

// ── currentPrice ──────────────────────────────────────────────
test('parses currentPrice from "Current Price: 19.99"', () => {
  const r = parseDealText('Current Price: 19.99');
  assert.equal(r.currentPrice, 19.99);
});

test('parses currentPrice stripping leading $', () => {
  const r = parseDealText('Current Price: $19.99');
  assert.equal(r.currentPrice, 19.99);
});

test('parses currentPrice stripping commas ("1,299.00")', () => {
  const r = parseDealText('price: 1,299.00');
  assert.equal(r.currentPrice, 1299);
});

test('parses currentPrice alias "sale price"', () => {
  const r = parseDealText('sale price: $9.99');
  assert.equal(r.currentPrice, 9.99);
});

test('parses currentPrice alias "deal price"', () => {
  const r = parseDealText('deal price: 5.00');
  assert.equal(r.currentPrice, 5);
});

test('parses currentPrice alias "current_price"', () => {
  const r = parseDealText('current_price: 12.50');
  assert.equal(r.currentPrice, 12.5);
});

// ── originalPrice ─────────────────────────────────────────────
test('parses originalPrice from "Original Price: $29.99"', () => {
  const r = parseDealText('Original Price: $29.99');
  assert.equal(r.originalPrice, 29.99);
});

test('parses originalPrice alias "Price Before"', () => {
  const r = parseDealText('Price Before: 50.00');
  assert.equal(r.originalPrice, 50);
});

test('parses originalPrice alias "Regular Price"', () => {
  const r = parseDealText('Regular Price: $99.95');
  assert.equal(r.originalPrice, 99.95);
});

test('parses originalPrice alias "MSRP"', () => {
  const r = parseDealText('MSRP: 199.00');
  assert.equal(r.originalPrice, 199);
});

test('parses originalPrice alias "list price"', () => {
  const r = parseDealText('list price: 49.99');
  assert.equal(r.originalPrice, 49.99);
});

test('parses originalPrice alias "Price Before Deals"', () => {
  const r = parseDealText('Price Before Deals: 39.99');
  assert.equal(r.originalPrice, 39.99);
});

test('parses originalPrice alias "original_price"', () => {
  const r = parseDealText('original_price: 25.00');
  assert.equal(r.originalPrice, 25);
});

// ── percentOff ────────────────────────────────────────────────
test('parses percentOff from "% Off: 50%"', () => {
  const r = parseDealText('% Off: 50%');
  assert.equal(r.percentOff, 50);
});

test('parses percentOff alias "Percent Off"', () => {
  const r = parseDealText('Percent Off: 33');
  assert.equal(r.percentOff, 33);
});

test('parses percentOff alias "Discount"', () => {
  const r = parseDealText('Discount: 25%');
  assert.equal(r.percentOff, 25);
});

test('parses percentOff alias "discount percent"', () => {
  const r = parseDealText('discount percent: 10');
  assert.equal(r.percentOff, 10);
});

test('parses percentOff alias "percent_off"', () => {
  const r = parseDealText('percent_off: 20%');
  assert.equal(r.percentOff, 20);
});

// ── Markdown table format ─────────────────────────────────────
test('parses currentPrice from Markdown table', () => {
  const r = parseDealText('| Current Price | $19.99 |');
  assert.equal(r.currentPrice, 19.99);
});

test('parses originalPrice from Markdown table', () => {
  const r = parseDealText('| Original Price | $29.99 |');
  assert.equal(r.originalPrice, 29.99);
});

test('parses percentOff from Markdown table', () => {
  const r = parseDealText('| % Off | 33% |');
  assert.equal(r.percentOff, 33);
});

// ── Multi-line / combined ─────────────────────────────────────
test('parses all three pricing fields together', () => {
  const r = parseDealText(
    'Current Price: $19.99\nOriginal Price: $29.99\nDiscount: 33%'
  );
  assert.equal(r.currentPrice, 19.99);
  assert.equal(r.originalPrice, 29.99);
  assert.equal(r.percentOff, 33);
});

test('ignores invalid numeric value gracefully', () => {
  const r = parseDealText('Current Price: TBD');
  assert.equal(r.currentPrice, undefined);
});

test('ignores empty string value for currentPrice', () => {
  // empty value → line skipped entirely by the parser (no match)
  const r = parseDealText('Current Price:');
  assert.equal(r.currentPrice, undefined);
});

test('handles negative price (strips $ and parses)', () => {
  const r = parseDealText('Current Price: -5.00');
  assert.equal(r.currentPrice, -5);
});

test('handles large number with commas', () => {
  const r = parseDealText('Original Price: $1,299.99');
  assert.equal(r.originalPrice, 1299.99);
});

// ── Summary ───────────────────────────────────────────────────
console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
