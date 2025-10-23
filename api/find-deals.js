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

  const { productInfo } = req.body;
  if (!productInfo || !productInfo.searchTerms) {
    return res.status(400).json({ error: 'Product info required' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // Use AI to search and find alternative sellers
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
          content: `Find alternative sellers for this product: ${productInfo.searchTerms}

Original product info:
- Brand: ${productInfo.brand || 'N/A'}
- Model: ${productInfo.model || 'N/A'}
- Category: ${productInfo.category || 'N/A'}
- Current price: $${productInfo.price || 'N/A'}

Search major retailers (Amazon, eBay, Walmart, Best Buy, Newegg, B&H Photo, Target) and specialty stores for this EXACT product.

Return ONLY valid JSON array with up to 5 alternative sellers:
[
  {
    "retailer": "Store Name",
    "url": "https://full-product-url",
    "price": "numeric value only",
    "availability": "in stock / out of stock",
    "shipping": "free / paid / info",
    "confidence": "high / medium / low"
  }
]

Only include results where you're confident it's the SAME product. Order by best price first.`
        }]
      })
    });

    const data = await response.json();
    let content = data.choices[0].message.content.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    const alternatives = JSON.parse(content);
    
    // Add rawPrice for comparison
    const processedAlternatives = alternatives.map(alt => ({
      ...alt,
      rawPrice: alt.price ? parseFloat(String(alt.price).replace(/[^0-9.]/g, '')) : null
    }));
    
    return res.status(200).json({
      original: productInfo,
      alternatives: processedAlternatives,
      savingsAvailable: processedAlternatives.some(alt => 
        alt.rawPrice && productInfo.rawPrice && alt.rawPrice < productInfo.rawPrice
      )
    });
  } catch (error) {
    console.error('Price discovery error:', error);
    return res.status(200).json({
      original: productInfo,
      alternatives: [],
      savingsAvailable: false,
      error: 'Unable to find alternative sellers'
    });
  }
}
