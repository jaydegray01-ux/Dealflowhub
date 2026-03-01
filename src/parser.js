/**
 * parseDealText – robustly extract deal fields from a pasted Markdown table
 * OR a "Field: Value" plaintext list and return a normalized deal object for autofill.
 *
 * Supported keys: Title, Deal Type, Description, Image URL, Product URL,
 *                 Promo Code, Category, Expires, Featured, Status,
 *                 Current Price, Original Price, Percent Off
 *
 * Field-label aliases (all case-insensitive, punctuation-stripped):
 *   imageUrl      ← "Product Image URL" | "imageUrl"      | "image"
 *   link          ← "Product URL"       | "link"          | "url"
 *   code          ← "Promo Code"        | "code"          | "promo"
 *   cat           ← "Category"          | "cat"
 *   currentPrice  ← "Current Price"     | "price"         | "sale price"  | "deal price"  | "current_price"  | "currentPrice"
 *   originalPrice ← "Original Price"    | "price before"  | "price before deals" | "regular price" | "MSRP" | "list price" | "original_price" | "originalPrice"
 *   percentOff    ← "% off"             | "percent off"   | "discount"    | "discount percent" | "percent_off" | "percentOff" | "savings"
 *
 * Numeric values for currentPrice / originalPrice / percentOff are normalized to
 * JS numbers: leading "$" and commas are stripped; a trailing "%" is stripped for
 * percentOff.  Examples: "19.99", "$19.99", "1,299.00", "50%".
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

  const norm = s => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');

  const clean = s =>
    s.replace(/\*\*/g, '')
     .replace(/^\*\((.+?)\)\*$/, '$1')
     .replace(/^\*(.+?)\*$/, '$1')
     .trim();

  // Strip leading "$", commas, and optional trailing "%" then parse as float.
  const parseNumeric = v => {
    const s = v.replace(/[$,]/g, '').replace(/%$/, '').trim();
    const n = parseFloat(s);
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
      const plain = line.match(/^\s*\*{0,2}([A-Za-z%][\w &%]+?)\*{0,2}\s*:\s*(.+)/);
      if (plain) { field = clean(plain[1]); value = clean(plain[2]); }
    }
    if (!field || !value) continue;
    if (/^[-:|]+$/.test(value) || /^[-:|]+$/.test(field)) continue;
    const key = norm(field);
    if (key === 'field' || key === 'suggestedentry') continue;
    const isNone = /^(\(none\)|none|n\/a|-)$/i.test(value);
    switch (key) {
      case 'title': out.title = value; break;
      case 'dealtype': { const dt = value.toUpperCase(); if (['SALE','PROMO','BOTH'].includes(dt)) out.dealType = dt; break; }
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
      case 'currentprice': case 'price': case 'saleprice': case 'dealprice': {
        const n = parseNumeric(value); if (n !== null) out.currentPrice = n; break;
      }
      case 'originalprice': case 'pricebefore': case 'pricebeforedeals': case 'regularprice': case 'msrp': case 'listprice': {
        const n = parseNumeric(value); if (n !== null) out.originalPrice = n; break;
      }
      case 'off': // normalized form of "% off" / "% Off"
      case 'percentoff': case 'discount': case 'discountpercent': case 'savings': {
        const n = parseNumeric(value); if (n !== null) out.percentOff = n; break;
      }
      default: break;
    }
  }
  return out;
}

/**
 * parseMethodText – extract Save & Earn method fields from a pasted
 * Markdown table OR "Field: Value" plaintext and return a normalized
 * object for autofill in MethodForm.
 *
 * Supported fields: Title, Tab Type, Summary, Description, Steps,
 *                   Potential Range, Requirements, Tips, Links
 *
 * Field-label aliases (all case-insensitive, punctuation-stripped):
 *   title         ← "Title"
 *   tabType       ← "Tab Type" | "Tab" | "Type" | "tab_type"
 *   summary       ← "Summary"
 *   description   ← "Description"
 *   steps         ← "Steps" | "Step" | "How To" | "How To Use"
 *   potentialRange← "Potential Range" | "Potential" | "Earnings" | "How Much"
 *   requirements  ← "Requirements" | "Requirement" | "Requires"
 *   tips          ← "Tips" | "Tip" | "Pro Tips" | "Pro Tip"
 *   links         ← "Links" | "Link" | "URL" | "Website" | "Website URL"
 *
 * Multi-value fields (steps, links): separate items with semicolons or pipes in a
 * single "Field: Value" line, e.g. "Steps: Sign up; Activate; Shop; Get paid"
 * Individual numbered fields ("Step 1:", "Step 2:", …) are also collected in order.
 *
 * @param {string} raw  Raw pasted text
 * @returns {{ [key: string]: any }}  Normalized method object (empty if nothing parsed)
 */
export function parseMethodText(raw) {
  const out = {};
  if (!raw) return out;

  const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const clean = s =>
    s.replace(/\*\*/g, '')
     .replace(/^\*\((.+?)\)\*$/, '$1')
     .replace(/^\*(.+?)\*$/, '$1')
     .trim();

  // Split a single value into list items by semicolon or pipe, stripping leading numbers.
  const splitItems = v =>
    v.split(/\s*;\s*|\s*\|\s*/)
     .map(x => x.replace(/^\s*\d+[.):\-]\s*/, '').trim())
     .filter(Boolean);

  const numberedSteps = {};

  for (const line of raw.split('\n')) {
    let field = '', value = '';
    const tbl = line.match(/^\s*\|([^|]+)\|([^|]+)\|/);
    if (tbl) {
      field = clean(tbl[1]);
      value = clean(tbl[2]);
    } else {
      const plain = line.match(/^\s*\*{0,2}([A-Za-z%][\w &%]+?)\*{0,2}\s*:\s*(.+)/);
      if (plain) { field = clean(plain[1]); value = clean(plain[2]); }
    }
    if (!field || !value) continue;
    if (/^[-:|]+$/.test(value) || /^[-:|]+$/.test(field)) continue;
    const key = norm(field);
    if (key === 'field' || key === 'suggestedentry' || key === 'value') continue;
    if (/^(\(none\)|none|n\/a|-)$/i.test(value)) continue;

    // Collect numbered steps: "Step 1", "Step 2", etc.
    const stepNum = key.match(/^step(\d+)$/);
    if (stepNum) {
      numberedSteps[parseInt(stepNum[1], 10)] = value;
      continue;
    }

    switch (key) {
      case 'title': out.title = value; break;
      case 'tabtype': case 'tab': case 'type': {
        const v = value.toLowerCase().replace(/[\s_]/g, '');
        if (v === 'earnmore' || /earn/.test(v)) out.tabType = 'earn_more';
        else if (v === 'savemore' || /save/.test(v)) out.tabType = 'save_more';
        break;
      }
      case 'summary': out.summary = value; break;
      case 'description': out.description = value; break;
      case 'steps': case 'step': case 'howtouse': case 'howto': {
        const items = splitItems(value);
        if (items.length) out.steps = items;
        break;
      }
      case 'potentialrange': case 'potential': case 'earnings': case 'howmuch': {
        out.potentialRange = value; break;
      }
      case 'requirements': case 'requirement': case 'requires': {
        out.requirements = value; break;
      }
      case 'tips': case 'tip': case 'protips': case 'protip': {
        out.tips = value; break;
      }
      case 'links': case 'link': case 'url': case 'website': case 'websiteurl': {
        const items = splitItems(value).filter(x => /https?:\/\//i.test(x) || /^www\./i.test(x));
        if (items.length) out.links = items;
        break;
      }
      default: break;
    }
  }

  // Merge numbered steps ("Step 1:", "Step 2:", …) in ascending order.
  const nums = Object.keys(numberedSteps).map(Number).sort((a, b) => a - b);
  if (nums.length) {
    const existing = out.steps || [];
    out.steps = [...existing, ...nums.map(n => numberedSteps[n])];
  }

  return out;
}
