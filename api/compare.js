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
    
    const { urls } = req.body;
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ error: 'Please provide at least one product URL' });
    }
    
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    
    if (!OPENROUTER_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error - API key missing' });
    }
    
    try {
        const products = [];
        
        for (const url of urls) {
            if (!url || url.trim() === '') continue;
            
            try {
                // Use AI to extract product information from the URL
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://pickwise.club',
                        'X-Title': 'PickWise Product Extractor'
                    },
                    body: JSON.stringify({
                        model: 'meta-llama/llama-3.1-8b-instruct:free',
                        messages: [{
                            role: 'user',
                            content: `Extract product information from this URL: ${url}

Return ONLY a JSON object, no other text. Format:
{
  "name": "product name",
  "price": "$XX.XX",
  "retailer": "retailer name",
  "searchTerms": "keywords",
  "url": "${url}"
}

CRITICAL: Respond with ONLY the JSON object above, nothing else.`
                        }]
                    })
                });
                
                const data = await response.json();
                
                if (data.choices && data.choices[0]?.message?.content) {
                    try {
                        let content = data.choices[0].message.content.trim();
                        
                        // Remove markdown code blocks if present
                        content = content.replace(/```json\n?/gi, '').replace(/```\n?/g, '');
                        
                        // Remove any text before the first { and after the last }
                        const startIndex = content.indexOf('{');
                        const endIndex = content.lastIndexOf('}');
                        
                        if (startIndex !== -1 && endIndex !== -1) {
                            content = content.substring(startIndex, endIndex + 1);
                            
                            const productData = JSON.parse(content);
                            products.push({
                                name: productData.name || 'Unknown Product',
                                price: productData.price || 'N/A',
                                retailer: productData.retailer || extractRetailer(url),
                                searchTerms: productData.searchTerms || productData.name,
                                url: url,
                                rating: null,
                                inStock: true
                            });
                        } else {
                            // Fallback if can't find JSON
                            products.push(createFallbackProduct(url));
                        }
                    } catch (parseError) {
                        console.error('JSON parse error:', parseError);
                        products.push(createFallbackProduct(url));
                    }
                } else {
                    products.push(createFallbackProduct(url));
                }
                
            } catch (error) {
                console.error('Error processing URL:', url, error);
                products.push(createFallbackProduct(url));
            }
        }
        
        return res.status(200).json({ products });
        
    } catch (error) {
        console.error('Compare API error:', error);
        return res.status(500).json({ error: 'Failed to process product URLs' });
    }
}

function createFallbackProduct(url) {
    return {
        name: 'Product from ' + extractRetailer(url),
        price: 'N/A',
        retailer: extractRetailer(url),
        searchTerms: extractRetailer(url) + ' product',
        url: url,
        rating: null,
        inStock: true
    };
}

function extractRetailer(url) {
    try {
        const domain = new URL(url).hostname;
        const parts = domain.split('.');
        const retailer = parts[parts.length - 2];
        return retailer.charAt(0).toUpperCase() + retailer.slice(1);
    } catch {
        return 'Unknown Retailer';
    }
}