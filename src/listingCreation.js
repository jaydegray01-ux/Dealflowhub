const DEAL_CATEGORIES = [
  { id: 'electronics', label: 'Electronics' },
  { id: 'home-and-kitchen', label: 'Home & Kitchen' },
  { id: 'clothing', label: 'Clothing' },
  { id: 'beauty-and-personal-care', label: 'Beauty & Personal Care' },
  { id: 'health-and-household', label: 'Health & Wellness' },
  { id: 'tools-and-home-improvement', label: 'Tools & Home Improvement' },
  { id: 'baby', label: 'Baby & Kids' },
  { id: 'toys-and-games', label: 'Toys & Games' },
  { id: 'sports-and-outdoors', label: 'Sports & Outdoors' },
  { id: 'automotive', label: 'Automotive' },
  { id: 'pet-supplies', label: 'Pet Supplies' },
  { id: 'arts-and-crafts', label: 'Arts, Crafts & DIY' },
  { id: 'office-products', label: 'Office Products' },
  { id: 'books', label: 'Books' },
  { id: 'grocery-and-gourmet-food', label: 'Grocery & Gourmet Food' },
  { id: 'other', label: 'Other' },
];

export const CATEGORIES = DEAL_CATEGORIES;
export function buildDealFromParsed(parsed = {}) {
  const dealType = ['SALE', 'PROMO', 'BOTH', 'STACKABLE'].includes(parsed.dealType)
    ? parsed.dealType
    : 'SALE';

  const status = ['ACTIVE', 'INACTIVE'].includes(parsed.status)
    ? parsed.status
    : 'ACTIVE';

  return {
    title: (parsed.title || '').trim(),
    description: (parsed.description || '').trim(),
    link: (parsed.link || '').trim(),
    dealType,
    code: (parsed.code || '').trim(),
    cat: parsed.cat || 'other',
    expires: parsed.expires || null,
    featured: !!parsed.featured,
    status,
    imageUrl: (parsed.imageUrl || '').trim(),
    stackInstructions: (parsed.stackInstructions || '').trim(),
    isStackable: dealType === 'STACKABLE' || dealType === 'BOTH',
    stackOptions: Array.isArray(parsed.stackOptions) ? parsed.stackOptions : [],
    currentPrice: parsed.currentPrice ?? null,
    originalPrice: parsed.originalPrice ?? null,
    percentOff: parsed.percentOff ?? null,
    asin: (parsed.asin || '').trim(),
  };
}

export function validateDealForCreate(deal = {}) {
  const errors = [];
  if (!deal.title) errors.push('Title is required.');

  if ((deal.dealType === 'PROMO' || deal.dealType === 'BOTH') && !deal.code) {
    errors.push('Promo code is required for PROMO and BOTH deal types.');
  }

  if ((deal.isStackable || deal.dealType === 'STACKABLE') && !deal.stackInstructions) {
    errors.push('Stack instructions are required for stackable deal types.');
  }

  return errors;
}

export function toDbDeal(deal = {}) {
  return {
    title: deal.title,
    description: deal.description || '',
    link: deal.link || '',
    deal_type: deal.dealType,
    code: deal.code || '',
    category: deal.cat || 'other',
    clicks: deal.clicks ?? 0,
    saved: deal.saved ?? 0,
    expires: deal.expires,
    featured: deal.featured ?? false,
    vote_up: deal.voteUp ?? 0,
    vote_down: deal.voteDown ?? 0,
    status: deal.status || 'ACTIVE',
    image_url: deal.imageUrl || '',
    stack_instructions: deal.stackInstructions || '',
    is_stackable: deal.isStackable ?? ['STACKABLE', 'BOTH'].includes(deal.dealType),
    stack_options: deal.stackOptions ?? [],
    current_price: deal.currentPrice ?? null,
    original_price: deal.originalPrice ?? null,
    percent_off: deal.percentOff ?? null,
    asin: deal.asin || null,
  };
}
