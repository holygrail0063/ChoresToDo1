# Upload Code to GitHub

## 🚀 Quick Start: Using GitHub Desktop (Recommended)

Since you already have GitHub Desktop open, this is the easiest method:

### Option A: If the repository is already in GitHub Desktop

1. **Make sure you're signed in:**
   - Check that you're signed into your GitHub account (`holygrail0063`)
   - If not: File → Options → Accounts → Sign in

2. **Check if repository exists on GitHub:**
   - In GitHub Desktop, you should see `holygrail0063/ChoresToDo` in your repository list
   - If you see it, select it and click "Clone" (if not already cloned locally)

3. **If you need to add the local repository:**
   - File → Add Local Repository
   - Browse to: `D:\ChoresToDo`
   - Click "Add repository"
   - **If you see a message "This directory does not appear to be a Git repository":**
     - Click "create a repository" link at the bottom of the dialog
     - OR: Repository → New Repository
     - Name: `ChoresToDo`
     - Local path: `D:\ChoresToDo`
     - Click "Create Repository"

4. **Commit and Push:**
   - Once the repository is added, you should see all your files listed as changes
   - Review the changes in the left panel (all files should be checked/unstaged)
   - Write a commit message at the bottom (e.g., "Initial commit: ChoresToDo App")
   - Click "Commit to main" button (should be enabled now)
   - After committing, click "Publish repository" button in the top bar
   - Repository name: `ChoresToDo`
   - Owner: `holygrail0063`
   - Make sure "Keep this code private" is unchecked (unless you want it private)
   - Click "Publish Repository"

### Option B: Create a new repository on GitHub first

1. **Go to GitHub:**
   - Visit https://github.com/new
   - Repository name: `ChoresToDo`
   - Owner: `holygrail0063`
   - Leave it empty (don't initialize with README)
   - Click "Create repository"

2. **In GitHub Desktop:**
   - File → Add Local Repository
   - Browse to: `D:\ChoresToDo`
   - Click "Add repository"

3. **Publish:**
   - Click "Publish repository" button
   - Select the repository: `holygrail0063/ChoresToDo`
   - Click "Publish Repository"

---

## 📝 Alternative: Using Command Line

If you prefer using the command line or GitHub Desktop isn't working:

### Step 1: Install Git (if not already installed)

1. **Download Git for Windows:**
   - Go to https://git-scm.com/download/win
   - Download the latest version

2. **Install Git:**
   - Run the installer
   - **Important settings:**
     - ✅ Select "Git from the command line and also from 3rd-party software"
     - ✅ Select "Use bundled OpenSSH"
     - ✅ Select "Use the OpenSSL library"
     - ✅ Select "Checkout Windows-style, commit Unix-style line endings"

3. **Verify Installation:**
   - Close and reopen PowerShell
   - Run: `git --version`

### Step 2: Upload Your Code

Run these commands in PowerShell:

```powershell
# Navigate to your project folder
cd "D:\ChoresToDo"

# Initialize Git (if not already initialized)
git init

# Add all files
git add .

# Create your first commit
git commit -m "Initial commit: ChoresToDo App"

# Add the GitHub repository as remote
git remote add origin https://github.com/holygrail0063/ChoresToDo.git

# Rename branch to main and push
git branch -M main
git push -u origin main
```

**Note:** When you push, Git will ask for credentials:
- **Username**: `holygrail0063`
- **Password**: Use a **Personal Access Token** (see Step 3 below)

### Step 3: Create GitHub Personal Access Token

GitHub requires a Personal Access Token instead of a password:

1. **Go to GitHub Settings:**
   - Visit https://github.com/settings/tokens
   - Or: GitHub → Your profile picture → Settings → Developer settings → Personal access tokens → Tokens (classic)

2. **Generate New Token:**
   - Click "Generate new token" → "Generate new token (classic)"
   - Name: `ChoresToDo Upload`
   - Expiration: `90 days` (or your preference)
   - Select scopes:
     - ✅ **repo** (full control of private repositories)
   - Click "Generate token"

3. **Copy and Use the Token:**
   - **Important**: Copy the token immediately (you won't see it again!)
   - When Git asks for password, paste the token instead

---

## 🔧 Troubleshooting

**"git: command not found"**
- Git is not installed or not in PATH
- Install Git from https://git-scm.com/download/win
- Restart terminal after installation

**"Authentication failed"** (Command Line)
- Make sure you're using a Personal Access Token (not password)
- Token needs `repo` scope

**"Repository already exists"** (Command Line)
- If the remote already exists, remove it first:
  ```powershell
  git remote remove origin
  git remote add origin https://github.com/holygrail0063/ChoresToDo.git
  ```

**"Permission denied"**
- Check you have access to the repository
- Verify your GitHub username is correct

**"Can't click 'Commit to main'" or button is disabled:**
- The repository isn't initialized as a Git repository yet
- Solution: Repository → New Repository
  - Name: `ChoresToDo`
  - Local path: `D:\ChoresToDo`
  - Click "Create Repository"
- OR if adding existing folder: When you see "This directory does not appear to be a Git repository", click the "create a repository" link
- After initialization, all files should appear as changes and you'll be able to commit

**GitHub Desktop Issues:**
- Make sure you're signed into the correct GitHub account
- Try signing out and signing back in
- Check if the repository already exists on GitHub (you may need to delete it first or use a different name)

---

## ✅ After Uploading

Once your code is on GitHub, you can:

1. **View it online:** https://github.com/holygrail0063/ChoresToDo
2. **Deploy to hosting platforms** (Vercel, Railway, Netlify, etc.) by connecting your GitHub repository
3. **Share your code** with others
4. **Track changes** using Git version control
5. **Continue working:** Make changes locally, commit in GitHub Desktop, and push to sync with GitHub

---

## 📚 Quick Reference

**Repository URL:** https://github.com/holygrail0063/ChoresToDo  
**Local Path:** `D:\ChoresToDo`  
**GitHub Username:** `holygrail0063`  
**Repository Name:** `ChoresToDo`

