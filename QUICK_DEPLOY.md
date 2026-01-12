# Quick Deployment Guide - ChoresToDo.ca

## Fastest Path: Deploy with Vercel (5 minutes)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login
```bash
vercel login
```
This will open your browser to authenticate.

### Step 3: Deploy
```bash
vercel
```
Answer the prompts:
- Set up and deploy? → **Y**
- Which scope? → Select your account
- Link to existing project? → **N**
- Project name? → `chores-to-do` (or any name)
- Directory? → `./` (press Enter)
- Override settings? → **N**

### Step 4: Add Environment Variables

1. Go to https://vercel.com/dashboard
2. Click on your project (`chores-to-do`)
3. Go to **Settings** → **Environment Variables**
4. Add these 6 variables (from your Firebase project):

```
VITE_FIREBASE_API_KEY          = your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN      = your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID       = your_project_id
VITE_FIREBASE_STORAGE_BUCKET   = your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID = your_sender_id
VITE_FIREBASE_APP_ID           = your_app_id
```

To find these values:
- Go to Firebase Console → Project Settings → General tab
- Scroll to "Your apps" section
- If you have a web app, click the gear icon → Config
- Copy the values from the `firebaseConfig` object

### Step 5: Redeploy with Environment Variables
```bash
vercel --prod
```

### Step 6: Add Your Domain

1. In Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Click **Add Domain**
3. Enter: `ChoresToDo.ca` (note: capital C)
4. Also add: `www.ChoresToDo.ca` (optional)

### Step 7: Configure DNS

You'll see DNS instructions in Vercel. Choose one:

**Option A: Use Vercel's Nameservers (Easiest)**
- Log into your domain registrar (where you bought ChoresToDo.ca)
- Update nameservers to what Vercel shows you
- Usually something like: `ns1.vercel-dns.com`, `ns2.vercel-dns.com`

**Option B: Add DNS Records (Keep existing DNS)**
- Add a CNAME record:
  - Name: `@` (or leave blank for root domain)
  - Value: `cname.vercel-dns.com` (check Vercel for exact value)
- For www subdomain:
  - Name: `www`
  - Value: Same CNAME value

### Step 8: Wait for DNS Propagation

DNS changes can take 5 minutes to 48 hours. Usually it's fast (5-30 minutes).

Check status:
- https://dnschecker.org/#A/ChoresToDo.ca
- Or test in browser: https://ChoresToDo.ca

---

## That's It! 🎉

Your app should now be live at **ChoresToDo.ca**

---

## Future Deployments

After initial setup, you can:

**Option 1: Deploy manually**
```bash
vercel --prod
```

**Option 2: Auto-deploy from Git (Recommended)**
1. Push your code to GitHub/GitLab/Bitbucket
2. In Vercel Dashboard → Settings → Git
3. Connect your repository
4. Every push to `main` branch = automatic deployment

---

## Troubleshooting

**Build fails?**
- Make sure you run `npm install` first
- Check for TypeScript errors: `npm run build`

**Domain not working?**
- Wait up to 48 hours for DNS propagation
- Check DNS records are correct
- Verify domain is added in Vercel Dashboard

**Environment variables not working?**
- Make sure they start with `VITE_`
- Redeploy after adding variables: `vercel --prod`
- Check browser console for errors

**Need help?**
- Vercel Docs: https://vercel.com/docs
- Check `DEPLOYMENT.md` for detailed instructions

---

## Alternative: Netlify

If you prefer Netlify:

```bash
npm install -g netlify-cli
netlify login
npm run build
netlify deploy --prod --dir=dist
```

Then add environment variables and domain in Netlify Dashboard.

See `DEPLOYMENT.md` for full Netlify instructions.

