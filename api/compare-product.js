export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pickwise.club',
        'X-Title': 'PickWise Product Comparison'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [{
          role: 'user',
          content: `Fetch this product page and extract the following data in JSON format:
- title (product name)
- price (numeric value only, no currency symbols)
- currency (USD, EUR, etc.)
- rating (numeric value if available, otherwise null)
- reviewCount (number of reviews if available, otherwise null)
- availability (in stock, out of stock, etc.)
- specs (array of key specifications like weight, dimensions, material)

URL: ${url}

Respond ONLY with valid JSON. Do not include any markdown formatting or text outside the JSON structure.`
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      return res.status(500).json({ 
        error: 'Failed to fetch product data',
        details: errorText
      });
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return res.status(500).json({ error: 'Invalid API response' });
    }

    let responseText = data.choices[0].message.content;
    
    // Clean up markdown formatting
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const productData = JSON.parse(responseText);
      productData.url = url;
      productData.rawPrice = productData.price ? parseFloat(productData.price) : null;
      
      return res.status(200).json(productData);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Response:', responseText);
      
      // Return fallback data
      return res.status(200).json({
        url: url,
        title: 'Unable to extract product name',
        price: 'N/A',
        rawPrice: null,
        currency: 'USD',
        rating: null,
        reviewCount: null,
        availability: 'Unknown',
        specs: []
      });
    }

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
