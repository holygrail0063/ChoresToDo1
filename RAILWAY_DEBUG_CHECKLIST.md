# Railway Debug Checklist - "No authenticated user" Error

## ✅ Step 1: Verify Variables Were Added BEFORE Last Build

**CRITICAL:** With Vite, environment variables are embedded at BUILD TIME, not runtime.

1. **Check when variables were added:**
   - Go to Railway Dashboard → Your Project → **Variables** tab
   - Check when you added the variables
   - Check when the last deployment happened (Deployments tab)

2. **If variables were added AFTER the last build:**
   - You MUST redeploy for variables to be included
   - Go to **Deployments** tab
   - Click ⋯ on latest deployment → **Redeploy**
   - Wait for build to complete (this is crucial!)

## ✅ Step 2: Check Build Logs for Environment Variables

1. Go to Railway Dashboard → **Deployments** tab
2. Click on the latest deployment
3. Check **Build Logs**
4. Look for these messages:
   - Build should complete successfully
   - No errors about "undefined" or missing variables
   - If you see errors, variables aren't being read during build

## ✅ Step 3: Verify Variables in Railway

1. Go to Railway Dashboard → **Variables** tab
2. Verify ALL 6 variables are present:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
3. Click on each variable to check:
   - Value is not empty
   - No extra spaces before/after
   - No quotes around the value (Railway should handle this)
   - Values match your local `.env` file exactly

## ✅ Step 4: Check Browser Console for Firebase Errors

Open your site → Press F12 → Console tab → Look for:

### Good Signs (Firebase initialized):
- No errors about Firebase config
- No "undefined" errors

### Bad Signs:
- `Firebase: Error (auth/api-key-not-valid)` → Wrong API key
- `Firebase: Error (auth/operation-not-allowed)` → Anonymous auth not enabled
- `Firebase: Error (auth/domain-not-allowed)` → Domain not authorized
- `Cannot read property 'apiKey' of undefined` → Variables not in build

## ✅ Step 5: Verify Firebase Console Settings

1. **Anonymous Authentication:**
   - Go to Firebase Console → Authentication → Sign-in method
   - **Anonymous** should be **Enabled** (green toggle)
   - If disabled, enable it and save

2. **Authorized Domains:**
   - Go to Firebase Console → Authentication → Settings tab
   - Scroll to **Authorized domains**
   - Make sure these are listed:
     - `chorestodo.ca`
     - `*.up.railway.app` (or your Railway domain)
     - `localhost` (for testing)

## ✅ Step 6: Test the Built JavaScript

1. Visit your site: `https://chorestodo.ca`
2. Press F12 → Sources tab (or Network tab)
3. Find the main JavaScript file (usually `index-xxxxx.js`)
4. Search for: `VITE_FIREBASE_API_KEY`
5. If you find it, the variables are in the build
6. If you see `undefined` or empty strings, variables weren't embedded

## ✅ Step 7: Manual Redeploy (Do This!)

Even if Railway says it auto-redeploys, manually trigger a redeploy:

1. Go to Railway Dashboard → **Deployments** tab
2. Click the three dots (⋯) on the latest deployment
3. Click **Redeploy**
4. **WAIT** for the build to complete (check build logs)
5. Once deployment shows "Active", try your site again
6. Use Incognito mode to bypass cache

## ✅ Step 8: Check Network Tab

1. Open your site → F12 → **Network** tab
2. Filter by "firebase" or "auth"
3. Try creating a schedule
4. Look for failed requests to Firebase
5. Check the error messages in failed requests

## 🔧 Quick Fix: Force Rebuild

If nothing else works, try this:

1. **Make a small change to trigger rebuild:**
   - Edit any file (e.g., add a comment to `src/App.tsx`)
   - Commit and push to GitHub
   - Railway will auto-deploy

2. **OR use Railway CLI:**
   ```bash
   railway up
   ```

## 🚨 If Still Not Working

If you've done all of the above and it still doesn't work:

1. **Check if variables are actually being used:**
   - The JavaScript bundle should contain your Firebase config values
   - If they're all `undefined`, Railway isn't passing variables to the build

2. **Try a different platform:**
   - Railway can be tricky with Vite environment variables
   - Vercel/Netlify handle this better for static sites
   - Consider switching if Railway continues to have issues

3. **Contact Railway Support:**
   - They can check if variables are being passed to the build process
   - Share your deployment logs with them

