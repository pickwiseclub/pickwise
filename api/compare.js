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
                        model: 'google/gemini-flash-1.5-8b:free',
                        messages: [{
                            role: 'user',
                            content: `Extract product information from this URL and respond with ONLY valid JSON, no other text:

URL: ${url}

Response format (ONLY this JSON, nothing else):
{"name":"product name","price":"$XX.XX","retailer":"retailer name","searchTerms":"keywords","url":"${url}"}`
                        }]
                    })
                });
                
                const data = await response.json();
                
                if (data.choices && data.choices[0]?.message?.content) {
                    try {
                        let content = data.choices[0].message.content.trim();
                        
                        // Remove any markdown, code blocks, or extra text
                        content = content.replace(/```json/gi, '').replace(/```/g, '').trim();
                        
                        // Find JSON object
                        let startIdx = content.indexOf('{');
                        let endIdx = content.lastIndexOf('}');
                        
                        if (startIdx !== -1 && endIdx !== -1) {
                            const jsonStr = content.substring(startIdx, endIdx + 1);
                            const productData = JSON.parse(jsonStr);
                            
                            products.push({
                                name: productData.name || 'Unknown Product',
                                price: productData.price || 'N/A',
                                retailer: productData.retailer || extractRetailer(url),
                                searchTerms: productData.searchTerms || productData.name || extractRetailer(url),
                                url: url,
                                rating: null,
                                inStock: true
                            });
                        } else {
                            console.error('No JSON found in response');
                            products.push(createFallbackProduct(url));
                        }
                    } catch (parseError) {
                        console.error('JSON parse error:', parseError, 'Content:', data.choices[0].message.content);
                        products.push(createFallbackProduct(url));
                    }
                } else {
                    console.error('No AI response');
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