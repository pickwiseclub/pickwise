# PickWise Deployment

## Files
- api/compare.js - Serverless function
- public/index.html - Landing page
- public/app.html - Comparison tool
- package.json, vercel.json, .gitignore

## Deploy

### 1. Push to GitHub
1. Open GitHub Desktop
2. Go to your pickwise repository
3. DELETE everything in your local folder
4. COPY all these files into your local folder
5. Commit: "Working version"
6. Push origin

### 2. Add API Key to Vercel
1. Go to vercel.com → pickwise project
2. Settings → Environment Variables
3. Add: OPENROUTER_API_KEY = your key
4. Check all 3 environments
5. Save

### 3. Test
- Wait 2 minutes
- Go to pickwise.club/app
- Test comparison

Done.
