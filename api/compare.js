export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL required' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pickwise.club'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [{
          role: 'user',
          content: `Analyze this product page and extract detailed information: ${url}

Return ONLY valid JSON with this exact structure:
{
  "title": "full product name with brand and model",
  "price": "numeric value only, no currency symbols",
  "currency": "USD",
  "rating": "numeric rating or null",
  "reviewCount": "number of reviews or null",
  "availability": "in stock / out of stock / limited",
  "specs": ["key specification 1", "key specification 2"],
  "brand": "brand name",
  "model": "model number/name",
  "category": "product category",
  "searchTerms": "optimized search query for finding this exact product"
}

Focus on accuracy. For searchTerms, include brand, model, and key identifiers that would find THIS specific product on other sites.`
        }]
      })
    });

    const data = await response.json();
    let content = data.choices[0].message.content.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    const productData = JSON.parse(content);
    productData.url = url;
    productData.rawPrice = productData.price ? parseFloat(String(productData.price).replace(/[^0-9.]/g, '')) : null;
    
    return res.status(200).json(productData);
  } catch (error) {
    console.error('Extraction error:', error);
    return res.status(200).json({
      url,
      title: 'Unable to extract product data',
      price: 'N/A',
      rawPrice: null,
      currency: 'USD',
      rating: null,
      reviewCount: null,
      availability: 'Unknown',
      specs: [],
      brand: null,
      model: null,
      category: null,
      searchTerms: null
    });
  }
}
