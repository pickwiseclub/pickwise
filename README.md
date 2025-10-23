# PickWise v2.0 - AI-Powered Product Comparison

## What's New

### Three Powerful Comparison Modes:

1. **Manual Compare** - Traditional side-by-side comparison
   - Paste 2-3 product URLs
   - Compare prices, ratings, specs
   
2. **AI Price Finder** - Automatic deal discovery
   - Paste 1 product URL
   - AI identifies the product
   - Searches web for same product at other retailers
   - Shows you where to get better prices
   
3. **Hybrid Mode** - Best of both worlds
   - Start with your URLs
   - Let AI find additional options automatically
   - Maximum coverage and savings

## Files Included

```
pickwise-v2/
├── api/
│   ├── compare.js       - Enhanced product extraction with search terms
│   └── find-deals.js    - AI-powered alternative seller discovery
├── public/
│   ├── index.html       - Landing page
│   └── app.html         - Multi-mode comparison interface
├── package.json
├── vercel.json
├── .gitignore
└── README.md
```

## Deployment Instructions

### Step 1: Replace GitHub Repository

1. Open **GitHub Desktop**
2. Go to your `pickwise` repository
3. **Delete ALL files** in your local folder
4. **Copy ALL files** from `pickwise-v2` into your local folder
5. Commit message: "v2.0 - AI price discovery"
6. **Push to GitHub**

### Step 2: Verify Environment Variable

Your OpenRouter API key should already be set in Vercel. If not:

1. Go to **vercel.com** → pickwise project
2. **Settings** → **Environment Variables**
3. Verify `OPENROUTER_API_KEY` exists
4. If missing, add it (check all 3 environments)

### Step 3: Wait for Deployment

- Vercel auto-deploys when you push
- Check **Deployments** tab
- Wait for "Ready" status (~2 minutes)

### Step 4: Test All Modes

Go to **pickwise.club/app** and test:

1. **Manual Compare**: 
   - Paste 2-3 product URLs
   - Verify comparison works

2. **AI Price Finder**:
   - Paste 1 product URL
   - Click "Find Better Prices with AI"
   - Should show original + alternative sellers

3. **Hybrid Mode**:
   - Paste 1-2 URLs
   - Enable "Let AI find additional options"
   - Should combine manual + AI results

## How It Works

### Manual Compare
- User inputs URLs → API extracts data → Display comparison
- Same as v1, but enhanced extraction

### AI Price Finder
1. User inputs 1 URL
2. API extracts product details + generates search terms
3. AI searches for same product at other retailers
4. Returns alternative sellers with prices
5. Display with savings calculations

### Hybrid Mode
1. Extract data from user URLs
2. Use first product's search terms
3. AI finds 2-3 additional options
4. Combine all results
5. Display comprehensive comparison

## API Endpoints

### POST /api/compare
Extracts product data from URL including search terms for finding alternatives

### POST /api/find-deals
Takes product info, searches for alternative sellers, returns pricing options

## Value Proposition

**Old**: "Compare the products you found"
**New**: "We'll find you better prices"

This makes PickWise a **deal-finding tool**, not just a comparison widget.

## Notes

- AI price discovery uses same OpenRouter API
- Search quality depends on product info extraction
- Some products easier to find than others
- Users can always fall back to manual compare
- Hybrid mode gives best coverage

## Troubleshooting

**If AI mode doesn't work:**
- Check API key is set in Vercel
- Test manual mode first
- Check browser console for errors
- Verify OpenRouter account has credits

**If extraction fails:**
- Some sites harder to extract than others
- AI will return fallback data
- User can still access product via link

## Launch Strategy

Market this as: **"Stop searching for deals manually. PickWise finds them for you."**

The AI price discovery is the killer feature that differentiates from every other comparison tool.
