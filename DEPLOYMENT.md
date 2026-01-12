# Deployment Guide for ChoresToDo.ca

This guide covers deploying your Household Chores App to ChoresToDo.ca using various hosting platforms.

## Prerequisites

1. **Build the app locally first:**
   ```bash
   npm run build
   ```
   This creates a `dist` folder with production-ready files.

2. **Set up environment variables** on your hosting platform (see below).

3. **Have your domain ready** - ChoresToDo.ca should be pointing to your hosting provider.

---

## Option 1: Vercel (Recommended - Easiest)

Vercel offers free hosting with excellent performance and easy custom domain setup.

### Setup Steps:

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   Follow the prompts. When asked:
   - Set up and deploy? **Yes**
   - Which scope? Select your account
   - Link to existing project? **No**
   - Project name? `chores-to-do`
   - Directory? `./` (current directory)
   - Override settings? **No**

4. **Set Environment Variables:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project
   - Go to Settings → Environment Variables
   - Add all your Firebase variables:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`

5. **Redeploy after adding environment variables:**
   ```bash
   vercel --prod
   ```

6. **Add Custom Domain:**
   - In Vercel Dashboard → Settings → Domains
   - Click "Add Domain"
   - Enter `ChoresToDo.ca`
   - Also add `www.ChoresToDo.ca` (optional but recommended)
   - Follow DNS instructions (see DNS Setup section below)

7. **Automatic Deployments:**
   - Connect your GitHub/GitLab/Bitbucket repository
   - Every push to `main` branch will auto-deploy
   - Or use: `vercel --prod` to deploy manually

### Vercel Configuration

The included `vercel.json` file configures:
- Build command: `npm run build`
- Output directory: `dist`
- Proper routing for React Router

---

## Option 2: Netlify

Netlify is another excellent free hosting option with simple setup.

### Setup Steps:

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login:**
   ```bash
   netlify login
   ```

3. **Deploy:**
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

4. **Set Environment Variables:**
   - Go to [Netlify Dashboard](https://app.netlify.com/)
   - Select your site
   - Go to Site settings → Environment variables
   - Add all Firebase variables (same as Vercel)

5. **Add Custom Domain:**
   - Go to Domain settings → Add custom domain
   - Enter `ChoresToDo.ca`
   - Follow DNS instructions

6. **Continuous Deployment:**
   - Connect your Git repository in Netlify Dashboard
   - Auto-deploys on push to main branch

The included `netlify.toml` file configures the build settings.

---

## Option 3: Firebase Hosting

Since you're already using Firebase, hosting there is convenient.

### Setup Steps:

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login:**
   ```bash
   firebase login
   ```

3. **Initialize Firebase Hosting:**
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Public directory: `dist`
   - Configure as single-page app: **Yes**
   - Set up automatic builds: **No** (or Yes if you want)
   - Overwrite index.html: **No**

4. **Build and Deploy:**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

5. **Set Environment Variables:**
   - For Firebase Hosting, you can't set env vars directly
   - You'll need to update `src/firebase/config.ts` to use your actual values (NOT recommended for security)
   - **Better option**: Use Vite's build-time replacement or switch to a platform that supports env vars

6. **Add Custom Domain:**
   - In Firebase Console → Hosting → Add custom domain
   - Enter `ChoresToDo.ca`
   - Follow DNS verification steps

**Note:** Firebase Hosting doesn't support environment variables easily. Consider using Vercel or Netlify instead if you want to keep env vars secure.

---

## Option 4: Cloudflare Pages

Free hosting with great performance and easy domain setup (especially if your domain is with Cloudflare).

### Setup Steps:

1. **Push code to GitHub/GitLab/Bitbucket**

2. **Go to Cloudflare Dashboard:**
   - Navigate to Workers & Pages
   - Click "Create application" → "Pages" → "Connect to Git"

3. **Configure Build:**
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/`

4. **Set Environment Variables:**
   - Go to Settings → Environment Variables
   - Add all Firebase variables

5. **Add Custom Domain:**
   - Go to Custom domains
   - Add `ChoresToDo.ca`
   - If domain is on Cloudflare, auto-configures DNS

---

## DNS Setup for ChoresToDo.ca

After adding your domain to your hosting provider, you need to configure DNS records.

### If using Vercel/Netlify:

**Option A: Nameservers (Easiest)**
- Update your domain's nameservers at your registrar to point to:
  - Vercel: Check Vercel dashboard for nameservers
  - Netlify: `dns1.p01.nsone.net` and `dns2.p01.nsone.net`

**Option B: DNS Records (Keep existing DNS)**
- Add a CNAME record:
  - Name: `@` or `ChoresToDo.ca`
  - Value: (provided by hosting platform, e.g., `cname.vercel-dns.com`)
- For www subdomain:
  - Name: `www`
  - Value: Same as above

### DNS Propagation:
- Changes can take 24-48 hours to propagate
- Usually works within minutes to hours
- Check DNS status: https://dnschecker.org

---

## Important Notes

### Current Routing Setup

Your app uses **HashRouter**, which means URLs look like:
- `ChoresToDo.ca/#/house/ABC123`

If you want cleaner URLs (without the `#`), you can switch to **BrowserRouter**, but you'll need server configuration to handle client-side routing:

**For BrowserRouter support**, update `src/App.tsx`:
```typescript
// Change from:
import { HashRouter, ... } from 'react-router-dom';
// To:
import { BrowserRouter, ... } from 'react-router-dom';

// And:
<HashRouter> → <BrowserRouter>
```

Then update share links in `src/utils/shareLink.ts` to not include `#`.

The included `vercel.json` and `netlify.toml` include rewrite rules for BrowserRouter if you decide to switch.

### Environment Variables

Keep your Firebase config secure by using environment variables. Never commit `.env` files with real keys to Git.

Create a `.env` file locally (already gitignored):
```
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## Recommended: Vercel Setup (Quick Start)

The fastest way to get ChoresToDo.ca live:

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Set environment variables in Vercel Dashboard

# 5. Add custom domain in Vercel Dashboard

# 6. Final production deploy
vercel --prod
```

---

## Troubleshooting

**Build fails:**
- Check that all dependencies are in `package.json`
- Run `npm install` before building
- Check for TypeScript errors: `npm run build`

**Environment variables not working:**
- Ensure variables start with `VITE_` prefix
- Redeploy after adding environment variables
- Check browser console for errors

**Domain not connecting:**
- Wait for DNS propagation (can take up to 48 hours)
- Verify DNS records are correct using `dig` or online DNS checker
- Check domain registrar settings

**404 errors on refresh:**
- If using BrowserRouter, ensure server rewrite rules are configured
- With HashRouter, this shouldn't happen

---

## Post-Deployment Checklist

- [ ] Build completes successfully
- [ ] Environment variables are set
- [ ] Custom domain is added and verified
- [ ] DNS records are configured
- [ ] Site is accessible at ChoresToDo.ca
- [ ] Firebase authentication works
- [ ] Creating a house works
- [ ] Joining a house works
- [ ] Share links work correctly

---

## Support

For hosting platform-specific issues:
- Vercel: https://vercel.com/docs
- Netlify: https://docs.netlify.com
- Firebase: https://firebase.google.com/docs/hosting
- Cloudflare: https://developers.cloudflare.com/pages

