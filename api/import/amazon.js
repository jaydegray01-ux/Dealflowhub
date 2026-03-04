import { importAmazonFromUrl } from '../../src/amazonImport.js';

export function createAmazonImportHandler({ fetchImpl = fetch } = {}) {
  return async function handler(req, res) {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const assocTag = process.env.AMAZON_ASSOC_TAG;
    if (!assocTag) {
      res.status(500).json({ error: 'Server is missing AMAZON_ASSOC_TAG configuration.' });
      return;
    }

    const url = req.body?.url;

    try {
      const payload = await importAmazonFromUrl({ url, assocTag, fetchImpl });
      res.status(200).json({
        deal: {
          asin: payload.asin,
          title: payload.title,
          imageUrl: payload.imageUrl,
          link: payload.affiliateUrl,
          description: payload.description,
          canonicalUrl: payload.canonicalUrl,
        },
      });
    } catch (error) {
      res.status(400).json({ error: error?.message || 'Amazon import failed.' });
    }
  };
}

export default createAmazonImportHandler();
