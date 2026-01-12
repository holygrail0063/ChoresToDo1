# House Chores App

A simple single-page web application for managing household chores with multiple housemates. Built with React, TypeScript, Vite, and Firebase Firestore.

## Features

- **House-specific share links**: Each house has a unique code that can be shared with housemates
- **Default chores**: Pre-loaded common household chores when a house is created
- **Real-time updates**: Changes sync instantly across all devices using Firebase Firestore
- **Anonymous authentication**: No user accounts required - uses Firebase Anonymous Auth
- **Local user names**: Each device can set a name per house (stored in localStorage)
- **Smart chore management**: 
  - Add, edit, and delete chores
  - Assign chores to housemates
  - Set due dates
  - Mark chores as complete (only if assigned to you)
  - Automatic sorting (incomplete first, then by due date)
  - Overdue highlighting

## Prerequisites

Before you start, you need to install Node.js (which includes npm):

1. **Download Node.js:**
   - Go to [https://nodejs.org/](https://nodejs.org/)
   - Download the "LTS" (Long Term Support) version (recommended)
   - Choose the Windows Installer (.msi) for your system (64-bit or 32-bit)

2. **Install Node.js:**
   - Run the downloaded installer
   - Click "Next" through the installation wizard
   - **Important**: Make sure "Add to PATH" is checked (it should be by default)
   - Click "Install" and wait for it to finish

3. **Verify installation:**
   - Close and reopen your terminal/PowerShell
   - Type: `node --version` (should show a version number like v20.x.x)
   - Type: `npm --version` (should show a version number like 10.x.x)
   - If both commands work, you're ready to continue!

**You also need:**
- A Firebase account (free) - we'll set this up in the Firebase Setup section below

## Firebase Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard (you can disable Google Analytics if you prefer)

### 2. Enable Firestore Database

1. In your Firebase project, go to **Build** → **Firestore Database**
2. Click "Create database"
3. Choose "Start in test mode" (we'll add security rules later)
4. Select a location for your database
5. Click "Enable"

### 3. Enable Anonymous Authentication

1. In your Firebase project, go to **Build** → **Authentication**
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Click on "Anonymous" in the providers list
5. Enable it and click "Save"

### 4. Create Web App

1. In your Firebase project, click the gear icon ⚙️ next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon `</>` to add a web app
5. Register your app with a nickname (e.g., "House Chores App")
6. **Copy the Firebase configuration object**: 
   - After clicking "Register app", Firebase will show you a configuration code block
   - You'll see something like this on the screen:
     ```javascript
     const firebaseConfig = {
       apiKey: "AIzaSy...",
       authDomain: "your-project.firebaseapp.com",
       projectId: "your-project-id",
       storageBucket: "your-project.appspot.com",
       messagingSenderId: "123456789",
       appId: "1:123456789:web:abc123"
     };
     ```
   - **What to do**: You don't need to copy this JavaScript code. Instead, just note down the 6 values (the text inside the quotes after each `:`). For example:
     - `apiKey` = "AIzaSy..." (copy everything inside the quotes)
     - `authDomain` = "your-project.firebaseapp.com"
     - `projectId` = "your-project-id"
     - `storageBucket` = "your-project.appspot.com"
     - `messagingSenderId` = "123456789"
     - `appId` = "1:123456789:web:abc123"
   - You can also click "Copy" button if Firebase provides one, or manually copy each value
   - **Note**: If you don't see this screen, you can always find these values later by going to Project Settings → Your apps → click on your web app

### 5. Add Environment Variables

This step creates a file that stores your Firebase configuration securely. The app will read these values when it starts.

**Step 5.1: Create the `.env` file**

1. In your project folder (the same folder where `package.json` and `README.md` are located)
2. Create a new file named exactly `.env` (with the dot at the beginning)
   - **Windows**: You can create this in Notepad, VS Code, or any text editor
   - **VS Code**: Right-click in the file explorer → New File → type `.env`
   - **Note**: Some systems hide files starting with `.` - make sure you can see it

**Step 5.2: Add your Firebase configuration values**

1. Open the `.env` file you just created
2. Copy and paste this template into the file:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

3. Now fill in each value from Step 4 (the Firebase config you copied):
   - Find the value you copied for `apiKey` → paste it after `VITE_FIREBASE_API_KEY=`
   - Find the value for `authDomain` → paste it after `VITE_FIREBASE_AUTH_DOMAIN=`
   - Find the value for `projectId` → paste it after `VITE_FIREBASE_PROJECT_ID=`
   - Find the value for `storageBucket` → paste it after `VITE_FIREBASE_STORAGE_BUCKET=`
   - Find the value for `messagingSenderId` → paste it after `VITE_FIREBASE_MESSAGING_SENDER_ID=`
   - Find the value for `appId` → paste it after `VITE_FIREBASE_APP_ID=`

**Example of what your completed `.env` file should look like:**

```env
VITE_FIREBASE_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz
VITE_FIREBASE_AUTH_DOMAIN=my-chores-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=my-chores-app
VITE_FIREBASE_STORAGE_BUCKET=my-chores-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

**Important notes:**
- Don't put quotes around the values (just paste them directly)
- Don't leave any spaces around the `=` sign
- Make sure there are no extra spaces or blank lines at the end
- Save the file when you're done

### 6. Set Up Firestore Security Rules

1. In Firebase Console, go to **Build** → **Firestore Database** → **Rules**
2. Replace the default rules with the content from `firebase.rules` file (see below)
3. Click "Publish"

**Firestore Security Rules:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to houses collection for authenticated users
    match /houses/{houseId} {
      allow read, write: if request.auth != null;
      
      // Allow read/write access to chores subcollection for authenticated users
      match /chores/{choreId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

## Installation

1. **Open a terminal/command prompt** in this project folder
   - In VS Code: Press `` Ctrl+` `` to open the terminal, or go to Terminal → New Terminal
   - In Windows Command Prompt or PowerShell, navigate to the project folder:
     - If you're on a different drive, first change to drive D: by typing `D:` and pressing Enter
     - Then navigate: `cd "Household chores app"`
     - Or use the full path in one command: `cd /d "D:\Household chores app"` (the `/d` flag changes both drive and directory)
   - Make sure you're in the correct folder (you should see files like `package.json` and `README.md`)

2. **Install the required packages** by running:

```bash
npm install
```

This will download all the necessary code libraries (React, Firebase, etc.) that the app needs to run.

## Running the App

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port shown in the terminal).

### Accessing from Your Phone

To access the app on your phone (or other devices on the same WiFi network):

1. **Make sure your phone is on the same WiFi network** as your computer

2. **Find your computer's local IP address:**
   - **Windows**: Open Command Prompt and run: `ipconfig`
   - Look for "IPv4 Address" under your WiFi adapter (usually starts with `192.168.` or `10.`)
   - Example: `192.168.1.100`

3. **On your phone's browser**, go to:
   ```
   http://[YOUR_IP_ADDRESS]:5173
   ```
   For example: `http://192.168.1.100:5173`

4. **If it doesn't work**, check:
   - Both devices are on the same WiFi network
   - Windows Firewall might be blocking the connection (you may need to allow Node.js through the firewall)
   - The dev server shows the network URL in the terminal output (look for "Local" and "Network" URLs)

## Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. **Create a House**: 
   - Open the app in your browser
   - Click "Create House" to generate a new house code
   - You'll be redirected to your house page

2. **Share the Link**:
   - Click "Copy Share Link" button
   - Share the link with your housemates via WhatsApp, email, etc.

3. **Set Your Name**:
   - On first visit, you'll be asked to enter your name
   - You can change it anytime using "Change name" in the header

4. **Manage Chores**:
   - Default chores are pre-loaded when a house is created
   - Click "+ Add Chore" to add custom chores
   - Click "Edit" on any chore to change assignment or due date
   - Check the checkbox to mark a chore as complete (only if assigned to you)
   - Click "Delete" to remove a chore

5. **View Status**:
   - Incomplete chores appear first
   - Overdue chores are highlighted in red
   - Completed chores show when they were done

## Project Structure

```
household-chores-app/
├── src/
│   ├── components/          # React components
│   │   ├── AddChoreModal.tsx
│   │   ├── ChoreItem.tsx
│   │   ├── ChoreList.tsx
│   │   ├── CreateHouse.tsx
│   │   ├── HouseHeader.tsx
│   │   └── NameModal.tsx
│   ├── firebase/            # Firebase configuration and functions
│   │   ├── auth.ts
│   │   ├── chores.ts
│   │   ├── config.ts
│   │   └── houses.ts
│   ├── pages/               # Page components
│   │   └── HousePage.tsx
│   ├── utils/               # Utility functions
│   │   ├── houseCode.ts
│   │   └── storage.ts
│   ├── App.tsx              # Main app component with routing
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── firebase.rules           # Firestore security rules
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Technologies Used

- **React 18**: UI library
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **React Router**: Client-side routing (HashRouter for GitHub Pages compatibility)
- **Firebase Firestore**: Real-time database
- **Firebase Auth**: Anonymous authentication
- **CSS**: Custom styling (no UI libraries)

## Notes

- The app uses HashRouter (`/#/h/...`) instead of BrowserRouter for better compatibility with static hosting
- User names are stored in localStorage, so each device can have a different name per house
- Only authenticated users (via Anonymous Auth) can read/write data
- All changes sync in real-time across all devices viewing the same house

## Troubleshooting

**npm install fails with "Execution_Policies" error (PowerShell):**

If you see an error like `cannot be loaded because running scripts is disabled on this system`, PowerShell is blocking npm. Here are three solutions (choose one):

**Solution 1: Use Command Prompt instead (Easiest)**
- Close PowerShell
- Open Command Prompt (cmd.exe) instead
- Navigate to your project folder: `cd "D:\Household chores app"`
- Run `npm install` again

**Solution 2: Change PowerShell execution policy (Recommended)**
- Open PowerShell as Administrator (right-click Start → "Windows PowerShell (Admin)")
- Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- Type `Y` when prompted
- Close and reopen your terminal
- Try `npm install` again

**Solution 3: Bypass for current session only**
- In your current PowerShell window, run: `Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process`
- Then run `npm install`

**App shows a blank white page:**
- **Most common cause**: Missing `.env` file. The app requires Firebase configuration to work.
  - Make sure you've completed the Firebase Setup section (steps 1-6) in the README
  - Check that a `.env` file exists in your project folder (same folder as `package.json`)
  - Verify the `.env` file has all 6 Firebase configuration values filled in
- **Check the browser console for errors**: Press `F12` → Go to the "Console" tab → Look for red error messages
- **After creating/updating `.env` file**: You need to restart the dev server:
  - Stop the server (press `Ctrl+C` in the terminal)
  - Run `npm run dev` again

**App won't load:**
- Check that your `.env` file exists and has all required Firebase variables
- Verify Firebase configuration values are correct (no extra spaces, no quotes around values)
- Make sure Firestore and Anonymous Auth are enabled in Firebase Console

**Can't create or edit chores:**
- Check Firestore security rules are published correctly
- Verify you're authenticated (check browser console for errors)
- Ensure Anonymous Auth is enabled in Firebase Console

**Changes not syncing:**
- Check your internet connection
- Verify Firestore is enabled and rules are correct
- Check browser console for any error messages

## License

Feel free to use this code for your own projects!

