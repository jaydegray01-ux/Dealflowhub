/**
 * Minimal self-check for parseDealText.
 * Run with:  node --experimental-vm-modules src/parser.test.js
 * (No external test framework needed – uses Node's built-in assert module.)
 */
import assert from 'node:assert/strict';
import { parseDealText, parseMethodText } from './parser.js';

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

// ── Category matching (& vs "and") ───────────────────────────
const CATS = [
  { id: 'toys-and-games',           label: 'Toys & Games' },
  { id: 'sports-and-outdoors',      label: 'Sports & Outdoors' },
  { id: 'tools-and-home-improvement', label: 'Tools & Home Improvement' },
  { id: 'home-and-kitchen',         label: 'Home & Kitchen' },
  { id: 'beauty-and-personal-care', label: 'Beauty & Personal Care' },
  { id: 'arts-and-crafts',          label: 'Arts, Crafts & DIY' },
];

test('matchCat: "Toys & Games" matches toys-and-games', () => {
  const r = parseDealText('Category: Toys & Games', CATS);
  assert.equal(r.cat, 'toys-and-games');
});

test('matchCat: "Toys and Games" matches toys-and-games', () => {
  const r = parseDealText('Category: Toys and Games', CATS);
  assert.equal(r.cat, 'toys-and-games');
});

test('matchCat: "Sports & Outdoors" matches sports-and-outdoors', () => {
  const r = parseDealText('Category: Sports & Outdoors', CATS);
  assert.equal(r.cat, 'sports-and-outdoors');
});

test('matchCat: "Sports and Outdoors" matches sports-and-outdoors', () => {
  const r = parseDealText('Category: Sports and Outdoors', CATS);
  assert.equal(r.cat, 'sports-and-outdoors');
});

test('matchCat: "Tools & Home Improvement" matches tools-and-home-improvement', () => {
  const r = parseDealText('Category: Tools & Home Improvement', CATS);
  assert.equal(r.cat, 'tools-and-home-improvement');
});

test('matchCat: "Tools and Home Improvement" matches tools-and-home-improvement', () => {
  const r = parseDealText('Category: Tools and Home Improvement', CATS);
  assert.equal(r.cat, 'tools-and-home-improvement');
});

// ── parseMethodText ───────────────────────────────────────────

test('parseMethodText: parses title from plaintext', () => {
  const r = parseMethodText('Title: Rakuten Cashback');
  assert.equal(r.title, 'Rakuten Cashback');
});

test('parseMethodText: parses tabType earn_more', () => {
  const r = parseMethodText('Tab Type: earn_more');
  assert.equal(r.tabType, 'earn_more');
});

test('parseMethodText: parses tabType save_more', () => {
  const r = parseMethodText('Tab Type: save_more');
  assert.equal(r.tabType, 'save_more');
});

test('parseMethodText: parses tabType from "Earn More" label', () => {
  const r = parseMethodText('Tab: Earn More');
  assert.equal(r.tabType, 'earn_more');
});

test('parseMethodText: parses tabType from "Save More" label', () => {
  const r = parseMethodText('Tab: Save More');
  assert.equal(r.tabType, 'save_more');
});

test('parseMethodText: parses summary', () => {
  const r = parseMethodText('Summary: Earn cashback at 3,500+ stores.');
  assert.equal(r.summary, 'Earn cashback at 3,500+ stores.');
});

test('parseMethodText: parses description', () => {
  const r = parseMethodText('Description: Full explanation here.');
  assert.equal(r.description, 'Full explanation here.');
});

test('parseMethodText: parses steps split by semicolons', () => {
  const r = parseMethodText('Steps: Sign up; Activate cashback; Shop; Get paid');
  assert.deepEqual(r.steps, ['Sign up', 'Activate cashback', 'Shop', 'Get paid']);
});

test('parseMethodText: parses steps split by pipes', () => {
  const r = parseMethodText('Steps: Sign up | Activate | Shop');
  assert.deepEqual(r.steps, ['Sign up', 'Activate', 'Shop']);
});

test('parseMethodText: parses numbered Step 1 / Step 2 fields', () => {
  const r = parseMethodText('Step 1: Sign up\nStep 2: Activate cashback\nStep 3: Shop');
  assert.deepEqual(r.steps, ['Sign up', 'Activate cashback', 'Shop']);
});

test('parseMethodText: parses potentialRange', () => {
  const r = parseMethodText('Potential Range: $50–$500/year');
  assert.equal(r.potentialRange, '$50–$500/year');
});

test('parseMethodText: parses potentialRange alias "Earnings"', () => {
  const r = parseMethodText('Earnings: $100–$300/month');
  assert.equal(r.potentialRange, '$100–$300/month');
});

test('parseMethodText: parses requirements', () => {
  const r = parseMethodText('Requirements: Free to join');
  assert.equal(r.requirements, 'Free to join');
});

test('parseMethodText: parses tips', () => {
  const r = parseMethodText('Tips: Stack with store sales for maximum savings.');
  assert.equal(r.tips, 'Stack with store sales for maximum savings.');
});

test('parseMethodText: parses single link URL', () => {
  const r = parseMethodText('Link: https://www.rakuten.com');
  assert.deepEqual(r.links, ['https://www.rakuten.com']);
});

test('parseMethodText: parses multiple links split by semicolons', () => {
  const r = parseMethodText('Links: https://www.rakuten.com; https://home.ibotta.com');
  assert.deepEqual(r.links, ['https://www.rakuten.com', 'https://home.ibotta.com']);
});

test('parseMethodText: parses from Markdown table rows', () => {
  const input = '| Title | Ibotta |\n| Tab Type | earn_more |\n| Potential Range | $20–$150/month |';
  const r = parseMethodText(input);
  assert.equal(r.title, 'Ibotta');
  assert.equal(r.tabType, 'earn_more');
  assert.equal(r.potentialRange, '$20–$150/month');
});

test('parseMethodText: ignores separator rows', () => {
  const r = parseMethodText('| --- | --- |');
  assert.deepEqual(r, {});
});

test('parseMethodText: returns empty object for empty input', () => {
  const r = parseMethodText('');
  assert.deepEqual(r, {});
});

test('parseMethodText: ignores none/n/a values', () => {
  const r = parseMethodText('Requirements: none');
  assert.equal(r.requirements, undefined);
});

test('parseMethodText: mixed plaintext parses multiple fields', () => {
  const input = 'Title: Cashback Card\nTab Type: save_more\nPotential Range: 1.5–5% back\nRequirements: Good credit';
  const r = parseMethodText(input);
  assert.equal(r.title, 'Cashback Card');
  assert.equal(r.tabType, 'save_more');
  assert.equal(r.potentialRange, '1.5–5% back');
  assert.equal(r.requirements, 'Good credit');
});

// ── Summary ───────────────────────────────────────────────────
console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
