# Deploying to Railway.app

Railway can host your static React app, but **Vercel or Netlify are recommended** for static sites as they're simpler and faster. Railway is better suited for apps with backends.

However, if you want to use Railway, here's how:

## Prerequisites

1. **Railway account**: Sign up at https://railway.app
2. **Railway CLI** (optional, but helpful):
   ```bash
   npm install -g @railway/cli
   ```

## Option 1: Deploy via Railway Dashboard (Easiest)

### Step 1: Prepare Your Project

1. **Install serve package** (needed to serve static files):
   ```bash
   npm install --save-dev serve
   ```

2. **Update package.json** to add a start script:
   ```json
   {
     "scripts": {
       "start": "serve -s dist -l $PORT",
       "build": "tsc && vite build"
     }
   }
   ```

### Step 2: Deploy via GitHub

1. **Push your code to GitHub** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Go to Railway Dashboard**:
   - Visit https://railway.app/dashboard
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Build Settings**:
   - Railway will auto-detect it's a Node.js project
   - Build Command: `npm run build`
   - Start Command: `npx serve -s dist -l $PORT`
   - Root Directory: `/` (leave as default)

### Step 3: Add Environment Variables

1. In Railway Dashboard → Your Project → Variables
2. Add all your Firebase environment variables:
   ```
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=your_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. **Redeploy** after adding variables (Railway auto-redeploys when you save)

### Step 4: Add Custom Domain

1. In Railway Dashboard → Your Project → Settings → Domains
2. Click "Generate Domain" to get a Railway domain first (for testing)
3. Then click "Custom Domain"
4. Enter: `ChoresToDo.ca`
5. Follow DNS instructions:
   - Add a CNAME record pointing to Railway's provided domain
   - Or use Railway's nameservers

---

## Option 2: Deploy via Railway CLI

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login
```bash
railway login
```

### Step 3: Initialize Project
```bash
railway init
```
- Select "Empty Project" or "Deploy from current directory"

### Step 4: Link to Existing Project (if you created one in dashboard)
```bash
railway link
```

### Step 5: Add Environment Variables
```bash
railway variables set VITE_FIREBASE_API_KEY=your_key
railway variables set VITE_FIREBASE_AUTH_DOMAIN=your_domain
railway variables set VITE_FIREBASE_PROJECT_ID=your_project_id
railway variables set VITE_FIREBASE_STORAGE_BUCKET=your_bucket
railway variables set VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
railway variables set VITE_FIREBASE_APP_ID=your_app_id
```

### Step 6: Deploy
```bash
railway up
```

### Step 7: Add Custom Domain
```bash
railway domain add ChoresToDo.ca
```

---

## Important Notes for Railway

### 1. Static File Serving

Railway expects a server process. For static sites, you need to:
- Use `serve` package to serve the `dist` folder
- The `$PORT` environment variable is required (Railway provides it)

### 2. Build Configuration

The included `railway.json` configures:
- Build command: `npm run build`
- Start command: `npx serve -s dist -l $PORT`

### 3. Pricing

- Railway has a **free tier** with $5 credit/month
- After free tier, it's pay-as-you-go
- For a static site, you might use very little resources
- **Vercel/Netlify are free** for static sites (better value)

### 4. Performance

- Railway is optimized for full-stack apps
- Vercel/Netlify have global CDN for static sites (faster)
- Railway will work, but may be slower than Vercel/Netlify

---

## Comparison: Railway vs Vercel/Netlify

| Feature | Railway | Vercel/Netlify |
|---------|---------|----------------|
| **Best For** | Full-stack apps, APIs | Static sites, JAMstack |
| **Free Tier** | $5 credit/month | Unlimited (for static) |
| **CDN** | No (single region) | Yes (global) |
| **Setup Complexity** | Medium | Very Easy |
| **Static Site Optimization** | No | Yes |
| **Deploy Speed** | Medium | Very Fast |

**Recommendation**: Use Railway if you plan to add a backend/API later. For a pure static site, Vercel or Netlify are better choices.

---

## Troubleshooting

**Build fails:**
- Make sure `serve` is installed: `npm install --save-dev serve`
- Check that `package.json` has the start script
- Verify environment variables are set

**App not loading:**
- Check that `$PORT` is used in start command
- Verify `dist` folder exists after build
- Check Railway logs: `railway logs`

**Environment variables not working:**
- Ensure variables start with `VITE_` prefix
- Redeploy after adding variables
- Check Railway logs for errors

**Domain not working:**
- Wait for DNS propagation (can take up to 48 hours)
- Verify DNS records are correct
- Check Railway domain settings

---

## Alternative: Use Railway for Backend + Vercel for Frontend

If you want to use Railway but get better static site performance:

1. **Deploy frontend to Vercel** (free, fast CDN)
2. **Deploy any future backend/API to Railway**
3. Connect them via API calls

This gives you the best of both worlds!

---

## Quick Start Commands

```bash
# Install serve
npm install --save-dev serve

# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up

# View logs
railway logs

# Add domain
railway domain add ChoresToDo.ca
```

---

For more help:
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway

