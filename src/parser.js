/**
 * parseDealText – robustly extract deal fields from a pasted Markdown table
 * OR a "Field: Value" plaintext list and return a normalized deal object for autofill.
 *
 * Supported keys: Title, Deal Type, Description, Image URL, Product URL,
 *                 Promo Code, Category, Expires, Featured, Status,
 *                 Current Price, Original Price, Percent Off
 *
 * Field-label aliases (all case-insensitive, punctuation-stripped):
 *   imageUrl      ← "Product Image URL" | "imageUrl" | "image"
 *   link          ← "Product URL"       | "link"     | "url"
 *   code          ← "Promo Code"        | "code"     | "promo"
 *   cat           ← "Category"          | "cat"
 *   currentPrice  ← "Current Price"     | "Sale Price" | "Deal Price" | "price"
 *   originalPrice ← "Original Price"    | "Original price" | "Price Before" |
 *                   "Regular Price"     | "MSRP"           | "List Price"   |
 *                   "price before deals"
 *   percentOff    ← "Percent Off"       | "discount"   | "savings"
 *
 * Pricing values are normalized: "$", "%", commas, and surrounding whitespace
 * are stripped and the result is converted to a Number (e.g. "$1,299.00" → 1299, "25%" → 25).
 *
 * Accepts:
 *   - Markdown table rows:  | Field | Value |
 *   - Plaintext "Key: Value" lines (bold markers stripped)
 *
 * @param {string} raw   - Raw pasted text
 * @param {Array}  cats  - Category definitions: [{ id, label }]
 *                         Pass the app's CATS array so matching stays in sync.
 * @returns {{ [key: string]: any }}  Normalized deal object (empty if nothing parsed)
 */
export function parseDealText(raw, cats = []) {
  const out = {};
  if (!raw) return out;

  const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  const clean = s =>
    s.replace(/\*\*/g, '')
     .replace(/^\*\((.+?)\)\*$/, '$1')
     .replace(/^\*(.+?)\*$/, '$1')
     .trim();

  const parsePrice = s => {
    const n = Number(s.replace(/[$,%\s]/g, ''));
    return isNaN(n) ? null : n;
  };

  const matchCat = val => {
    const v = norm(val);
    for (const c of cats) {
      if (norm(c.label) === v || c.id.replace(/-/g, '') === v) return c.id;
    }
    for (const c of cats) {
      const cl = norm(c.label);
      if (cl.includes(v) || (v.length >= 4 && v.includes(cl))) return c.id;
    }
    return null;
  };

  for (const line of raw.split('\n')) {
    let field = '', value = '';
    const tbl = line.match(/^\s*\|([^|]+)\|([^|]+)\|/);
    if (tbl) {
      field = clean(tbl[1]);
      value = clean(tbl[2]);
    } else {
      const plain = line.match(/^\s*\*{0,2}([A-Za-z][\w &]+?)\*{0,2}\s*:\s*(.+)/);
      if (plain) { field = clean(plain[1]); value = clean(plain[2]); }
    }
    if (!field || !value) continue;
    if (/^[-:|]+$/.test(value) || /^[-:|]+$/.test(field)) continue;
    const key = norm(field);
    if (key === 'field' || key === 'suggestedentry') continue;
    const isNone = /^(\(none\)|none|n\/a|-)$/i.test(value);
    switch (key) {
      case 'title': out.title = value; break;
      case 'dealtype': { const dt = value.toUpperCase(); if (['SALE','PROMO','BOTH','STACKABLE'].includes(dt)) out.dealType = dt; break; }
      case 'description': out.description = value; break;
      case 'productimageurl': case 'imageurl': case 'image': out.imageUrl = value; break;
      case 'producturl': case 'link': case 'url': out.link = value; break;
      case 'promocode': case 'code': case 'promo': if (!isNone) out.code = value; break;
      case 'category': case 'cat': { const cat = matchCat(value); if (cat) out.cat = cat; break; }
      case 'expires': {
        if (!isNone && !/pick/i.test(value)) {
          // Require at least a year+separator+month pattern to avoid false positives (e.g. bare numbers)
          if (/\d{4}[-/]\d{1,2}/.test(value) || /\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(value)) {
            const d = new Date(value);
            if (!isNaN(d)) out.expires = d.toISOString().slice(0, 10);
          }
        }
        break;
      }
      case 'featured': {
        if (!isNone && !/optional/i.test(value)) out.featured = /^(true|yes|1|featured)$/i.test(value);
        break;
      }
      case 'status': { const st = value.toUpperCase(); if (['ACTIVE','INACTIVE'].includes(st)) out.status = st; break; }
      case 'currentprice': case 'saleprice': case 'dealprice': case 'price': {
        if (!isNone) { const n = parsePrice(value); if (n !== null) out.currentPrice = n; }
        break;
      }
      case 'originalprice': case 'pricebefore': case 'regularprice': case 'msrp': case 'listprice': case 'pricebeforedeals': {
        if (!isNone) { const n = parsePrice(value); if (n !== null) out.originalPrice = n; }
        break;
      }
      case 'percentoff': case 'discount': case 'savings': {
        if (!isNone) { const n = parsePrice(value); if (n !== null) out.percentOff = n; }
        break;
      }
      default: break;
    }
  }
  return out;
}
