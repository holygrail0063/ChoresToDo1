# Troubleshooting Hosted Site Errors

## ❌ Error: "No authenticated user"

If you're seeing this error when trying to create a schedule on your hosted site, it's because **Firebase environment variables are missing** on your hosting platform.

### Why This Happens

Your app needs Firebase configuration to work. Without these environment variables:
- Firebase can't initialize
- Anonymous authentication fails
- The app can't connect to Firestore
- You see "No authenticated user" error

### ✅ Solution: Add Firebase Environment Variables

You need to add your Firebase configuration to your hosting platform. The steps depend on which platform you're using:

---

## 🔧 Fix for Vercel

1. **Go to Vercel Dashboard:**
   - Visit https://vercel.com/dashboard
   - Select your project

2. **Add Environment Variables:**
   - Go to **Settings** → **Environment Variables**
   - Add these 6 variables (copy from your local `.env` file):

   ```
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET
   VITE_FIREBASE_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID
   ```

3. **Redeploy:**
   - Go to **Deployments** tab
   - Click the three dots (⋯) on the latest deployment
   - Click **Redeploy**
   - OR: Run `vercel --prod` from your local machine

4. **Test:**
   - Wait for deployment to finish
   - Visit your site and try creating a schedule again

---

## 🔧 Fix for Netlify

1. **Go to Netlify Dashboard:**
   - Visit https://app.netlify.com/
   - Select your site

2. **Add Environment Variables:**
   - Go to **Site settings** → **Environment variables**
   - Click **Add a variable**
   - Add all 6 Firebase variables (one at a time or bulk import)

3. **Redeploy:**
   - Go to **Deploys** tab
   - Click **Trigger deploy** → **Deploy site**
   - OR: Push a commit to your connected Git repository

4. **Test:**
   - Wait for deployment to finish
   - Visit your site and try again

---

## 🔧 Fix for Railway

Since you're using Railway and variables are already set, follow these steps:

1. **Verify Variables Are Correct:**
   - Go to Railway Dashboard → Your Project → **Variables** tab
   - Click on each variable (or the ⋯ icon) to verify values are correct
   - Make sure there are no extra spaces or quotes
   - Values should match exactly what's in your local `.env` file

2. **Trigger a Manual Redeploy:**
   - Go to **Deployments** tab
   - Click the three dots (⋯) on the latest deployment
   - Click **Redeploy**
   - OR: If you have Railway CLI: `railway up`
   - Wait for the build to complete

3. **Check Deployment Logs:**
   - In Railway Dashboard → **Deployments** tab
   - Click on the latest deployment
   - Check **Build Logs** for any errors
   - Look for messages about environment variables or Firebase

4. **Verify Firebase Settings:**
   - See "Additional Checks" section below (Anonymous Auth must be enabled!)

5. **Test:**
   - Clear browser cache (or use Incognito mode)
   - Visit your site
   - Open browser console (F12) and check for errors
   - Try creating a schedule again

---

## 🔧 Fix for Firebase Hosting

Firebase Hosting doesn't support environment variables easily. You have two options:

### Option 1: Use Build-Time Replacement (Not Recommended for Security)

Update `src/firebase/config.ts` directly with your values (not secure for public repos).

### Option 2: Switch to Vercel/Netlify (Recommended)

These platforms support environment variables properly and are better for Vite apps.

---

## 📋 Where to Find Your Firebase Values

If you don't have your Firebase config values:

1. **Go to Firebase Console:**
   - Visit https://console.firebase.google.com/
   - Select your project

2. **Get Configuration:**
   - Click the gear icon ⚙️ → **Project settings**
   - Scroll to **Your apps** section
   - If you have a web app, click the gear icon → **Config**
   - Copy the values from the `firebaseConfig` object

3. **Map to Environment Variables:**
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`

---

## ✅ Additional Checks

After adding environment variables, also verify:

### 1. Anonymous Authentication is Enabled

1. Go to Firebase Console → Your Project
2. Click **Authentication** → **Sign-in method**
3. Find **Anonymous** in the list
4. If it's disabled, click it and **Enable**
5. Click **Save**

### 2. Authorized Domains (Optional but Recommended)

1. Go to Firebase Console → Authentication → **Settings** tab
2. Scroll to **Authorized domains**
3. Make sure your domain is listed (e.g., `chorestodo.ca`)
4. If not, click **Add domain** and add it

### 3. Firestore Rules are Published

1. Go to Firebase Console → **Firestore Database** → **Rules** tab
2. Make sure your rules are saved and published:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /houses/{houseId} {
         allow read, write: if request.auth != null;
         match /chores/{choreId} {
           allow read, write: if request.auth != null;
         }
       }
     }
   }
   ```
3. Click **Publish** if you made changes

---

## 🧪 How to Test

1. **Clear browser cache:**
   - Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
   - Clear cached images and files
   - OR: Use Incognito/Private mode

2. **Open browser console:**
   - Press `F12`
   - Go to **Console** tab
   - Look for any red errors

3. **Try creating a schedule:**
   - Go to your hosted site
   - Try creating a new house/schedule
   - The error should be gone!

---

## 🚨 Still Not Working?

If you've added environment variables and it's still not working:

1. **Check deployment logs:**
   - Vercel: Deployments → Click deployment → **Build Logs**
   - Netlify: Deployments → Click deployment → **Deploy log**
   - Railway: Deployments → Click deployment → View logs
   - Look for any build errors

2. **Check browser console:**
   - Press `F12` → Console tab
   - Look for Firebase initialization errors
   - Common errors:
     - "Firebase: Error (auth/api-key-not-valid)" → Wrong API key
     - "Firebase: Error (auth/domain-not-allowed)" → Domain not authorized
     - "Firebase: Error (auth/operation-not-allowed)" → Anonymous auth not enabled

3. **Verify environment variables are set:**
   - Check your hosting platform's environment variables page
   - Make sure all 6 variables are there
   - Make sure there are no extra spaces or quotes
   - Values should NOT be in quotes in the platform's UI

4. **Redeploy after changes:**
   - Always redeploy after adding/changing environment variables
   - The variables are only used during build time

---

## 📚 Related Documentation

- See `DEPLOYMENT.md` for full deployment instructions
- See `QUICK_DEPLOY.md` for quick deployment guide
- See `README.md` for local development setup

