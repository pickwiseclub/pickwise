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
          content: `Extract product data from: ${url}. Return JSON only: {"title":"product name","price":"99.99","currency":"USD","rating":"4.5","reviewCount":"100","availability":"in stock","specs":["spec1","spec2"]}`
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
    return res.status(200).json({
      url, title: 'Unable to extract', price: 'N/A', rawPrice: null, 
      currency: 'USD', rating: null, reviewCount: null, availability: 'Unknown', specs: []
    });
  }
}
