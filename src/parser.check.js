/**
 * parser.check.js – lightweight self-check for src/parser.js
 *
 * Run with:  node src/parser.check.js
 * (Requires Node >= 12.11 with "type": "module" in package.json, which this repo already has.)
 */

import { parseDealText } from './parser.js';

let passed = 0;
let failed = 0;

function assert(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    console.error(`    expected: ${JSON.stringify(expected)}`);
    console.error(`    actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

// ── Original Price aliases ────────────────────────────────────
console.log('\noriginalPrice aliases:');
assert('"Original price" (plaintext)',
  parseDealText('Original price: $39.99').originalPrice, 39.99);
assert('"Original Price" (plaintext)',
  parseDealText('Original Price: 39.99').originalPrice, 39.99);
assert('"Price Before" (plaintext)',
  parseDealText('Price Before: $1,299.00').originalPrice, 1299);
assert('"Regular Price" (plaintext)',
  parseDealText('Regular Price: 99.00').originalPrice, 99);
assert('"MSRP" (plaintext)',
  parseDealText('MSRP: $49.95').originalPrice, 49.95);
assert('"List Price" (plaintext)',
  parseDealText('List Price: 25.00').originalPrice, 25);
assert('"price before deals" (plaintext)',
  parseDealText('price before deals: $19.99').originalPrice, 19.99);
assert('"Original Price" markdown table',
  parseDealText('| Original Price | $39.99 |').originalPrice, 39.99);

// ── Current Price aliases ─────────────────────────────────────
console.log('\ncurrentPrice aliases:');
assert('"Current Price" (plaintext)',
  parseDealText('Current Price: $29.99').currentPrice, 29.99);
assert('"Sale Price" (plaintext)',
  parseDealText('Sale Price: 19.99').currentPrice, 19.99);
assert('"Deal Price" (plaintext)',
  parseDealText('Deal Price: $9.99').currentPrice, 9.99);
assert('"price" (plaintext)',
  parseDealText('price: 5.00').currentPrice, 5);
assert('"Current Price" markdown table',
  parseDealText('| Current Price | $29.99 |').currentPrice, 29.99);

// ── Percent Off aliases ───────────────────────────────────────
console.log('\npercentOff aliases:');
assert('"Percent Off" (plaintext)',
  parseDealText('Percent Off: 25').percentOff, 25);
assert('"Percent Off" with % symbol',
  parseDealText('Percent Off: 25%').percentOff, 25);
assert('"discount" (plaintext)',
  parseDealText('discount: 30').percentOff, 30);
assert('"savings" (plaintext)',
  parseDealText('savings: 15').percentOff, 15);
assert('"Percent Off" markdown table',
  parseDealText('| Percent Off | 20 |').percentOff, 20);

// ── Price normalization ───────────────────────────────────────
console.log('\nPrice normalization:');
assert('strips $ sign',
  parseDealText('Original Price: $39.99').originalPrice, 39.99);
assert('strips commas',
  parseDealText('Original Price: 1,299.00').originalPrice, 1299);
assert('strips $ and commas',
  parseDealText('Original Price: $1,299.00').originalPrice, 1299);
assert('bare integer',
  parseDealText('Original Price: 50').originalPrice, 50);

// ── Existing fields still work ────────────────────────────────
console.log('\nExisting field regression:');
assert('title still parsed',
  parseDealText('Title: My Deal').title, 'My Deal');
assert('status still parsed',
  parseDealText('Status: ACTIVE').status, 'ACTIVE');

// ── Summary ───────────────────────────────────────────────────
console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
