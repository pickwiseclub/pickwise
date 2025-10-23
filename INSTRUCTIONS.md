# PickWise Backend Update

## Files to Add

1. `/api/compare-product.js` - Serverless function that handles product comparison securely
2. `/public/app.html` - Updated app that calls the secure backend

## Deployment Steps

### Step 1: Add Files to GitHub

1. Open GitHub Desktop
2. Go to your `pickwise` repository
3. Copy these files into your local repository:
   - `api/compare-product.js` → into `api` folder (create if doesn't exist)
   - `public/app.html` → replace existing `app.html` in `public` folder
4. GitHub Desktop will show these as changes
5. Commit with message: "Add secure backend for product comparison"
6. Click "Push origin" to upload to GitHub

### Step 2: Add API Key to Vercel (SECURE)

1. Go to vercel.com/mrs-projects-357bc93c/pickwise
2. Click "Settings" tab
3. Click "Environment Variables" in sidebar
4. Click "Add New"
5. Name: `OPENROUTER_API_KEY`
6. Value: [PASTE YOUR OPENROUTER API KEY HERE]
7. Select all environments (Production, Preview, Development)
8. Click "Save"

### Step 3: Redeploy

Vercel will automatically redeploy when you push to GitHub. Wait 1-2 minutes, then test your site.

## Testing

Go to pickwise.club/app.html and try comparing 2-3 products. It should now work!

## Security Notes

- Your API key is stored as an encrypted environment variable
- It's never exposed to users
- All API calls go through your serverless function
- Completely secure
