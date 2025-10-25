export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { productName, searchTerms } = req.body;
    
    if (!productName && !searchTerms) {
        return res.status(400).json({ error: 'Please provide product name or search terms' });
    }
    
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    
    if (!OPENROUTER_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error - API key missing' });
    }
    
    try {
        // Use AI to search for alternative sellers
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://pickwise.club',
                'X-Title': 'PickWise Deal Finder'
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-3.1-8b-instruct:free',
                messages: [{
                    role: 'user',
                    content: `Find 2-3 retailers for: "${productName || searchTerms}"

Return ONLY a JSON array, no other text. Format:
[
  {
    "name": "product name",
    "price": "$XX.XX",
    "retailer": "Amazon",
    "url": "https://www.amazon.com/s?k=product",
    "inStock": true
  },
  {
    "name": "product name",
    "price": "$XX.XX",
    "retailer": "Walmart",
    "url": "https://www.walmart.com/search?q=product",
    "inStock": true
  }
]

CRITICAL: Respond with ONLY the JSON array above, nothing else. Use realistic price estimates.`
                }]
            })
        });
        
        const data = await response.json();
        
        if (data.choices && data.choices[0]?.message?.content) {
            try {
                let content = data.choices[0].message.content.trim();
                
                // Remove markdown code blocks if present
                content = content.replace(/```json\n?/gi, '').replace(/```\n?/g, '');
                
                // Remove any text before the first [ and after the last ]
                const startIndex = content.indexOf('[');
                const endIndex = content.lastIndexOf(']');
                
                if (startIndex !== -1 && endIndex !== -1) {
                    content = content.substring(startIndex, endIndex + 1);
                    
                    const alternatives = JSON.parse(content);
                    
                    // Validate and clean up the alternatives
                    const cleanedAlternatives = alternatives.map(alt => ({
                        name: alt.name || productName || 'Alternative Product',
                        price: alt.price || 'Check retailer for price',
                        retailer: alt.retailer || 'Retailer',
                        url: alt.url || '#',
                        inStock: alt.inStock !== false,
                        rating: alt.rating || null
                    }));
                    
                    return res.status(200).json({ 
                        alternatives: cleanedAlternatives,
                        searchTerms: searchTerms || productName
                    });
                } else {
                    // Return generic alternatives as fallback
                    return res.status(200).json({
                        alternatives: createGenericAlternatives(productName || searchTerms)
                    });
                }
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                return res.status(200).json({
                    alternatives: createGenericAlternatives(productName || searchTerms)
                });
            }
        } else {
            return res.status(200).json({
                alternatives: createGenericAlternatives(productName || searchTerms)
            });
        }
        
    } catch (error) {
        console.error('Find deals API error:', error);
        return res.status(500).json({ 
            error: 'Failed to find alternative deals',
            alternatives: createGenericAlternatives(productName || searchTerms)
        });
    }
}

function createGenericAlternatives(productInfo) {
    const productName = productInfo.substring(0, 50);
    return [
        {
            name: productName,
            price: 'Check website',
            retailer: 'Amazon',
            url: `https://www.amazon.com/s?k=${encodeURIComponent(productInfo)}`,
            inStock: true,
            rating: null
        },
        {
            name: productName,
            price: 'Check website',
            retailer: 'Walmart',
            url: `https://www.walmart.com/search?q=${encodeURIComponent(productInfo)}`,
            inStock: true,
            rating: null
        }
    ];
}