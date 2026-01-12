# House Chores App - Complete Project Overview

## 📁 File Structure

```
Household chores app/
├── 📄 Configuration Files
│   ├── package.json              # Dependencies and scripts
│   ├── tsconfig.json             # TypeScript configuration
│   ├── tsconfig.node.json        # TypeScript config for Node tools
│   ├── vite.config.ts            # Vite build configuration
│   ├── firebase.rules            # Firestore security rules
│   ├── index.html                # HTML entry point
│   ├── .env                      # Firebase config (NOT in git)
│   └── .gitignore                # Git ignore rules
│
├── 📂 src/
│   ├── main.tsx                  # React app entry point
│   ├── App.tsx                   # Main router component
│   ├── App.css                   # Global app styles
│   ├── index.css                 # Base CSS styles
│   │
│   ├── 📂 components/            # Reusable UI components
│   │   ├── SetupWizard.tsx/css   # 4-step house setup wizard
│   │   ├── CreateHouse.tsx/css   # Simple wrapper (redirects to SetupWizard)
│   │   ├── HouseHeader.tsx/css   # Header with name, share link, admin button
│   │   ├── ChoreList.tsx/css     # List of all chores
│   │   ├── ChoreItem.tsx/css     # Individual chore card
│   │   ├── AddChoreModal.tsx/css # Modal to add new chores
│   │   └── NameModal.tsx/css     # Modal to set/change user name
│   │
│   ├── 📂 pages/                 # Full page components
│   │   ├── HousePage.tsx/css     # Main house view page
│   │   └── AdminPage.tsx/css     # Admin schedule overview (5 weeks)
│   │
│   ├── 📂 firebase/              # Firebase integration
│   │   ├── config.ts             # Firebase initialization
│   │   ├── auth.ts               # Anonymous authentication
│   │   ├── houses.ts             # House CRUD operations
│   │   └── chores.ts             # Chore CRUD operations
│   │
│   └── 📂 utils/                 # Utility functions
│       ├── houseCode.ts          # Generate unique house codes
│       ├── storage.ts            # localStorage helpers (user names)
│       └── taskAssignment.ts     # Task grouping & assignment logic
│
└── 📂 node_modules/              # Dependencies (auto-generated)
```

---

## 🔄 Complete Application Flow

### 1. **Initial Setup (First Time User)**
```
User opens app → CreateHouse component → SetupWizard
```

**SetupWizard Steps:**
- **Step 1**: Enter house name
- **Step 2**: Enter number of members (1-11)
- **Step 3**: Add tasks
  - Common Areas (shared, rotate weekly)
  - Sole Responsibility (private spaces)
- **Step 4**: Review & Assign
  - Edit member names
  - Common areas: Auto-assigned to all members (5-week rotation)
  - Sole responsibility: Select which members are responsible
- **Create House**: Saves to Firebase, creates chores, redirects to house page

### 2. **House Page (Main View)**
```
HousePage → Authenticates → Loads house data → Shows ChoreList
```

**Components:**
- **HouseHeader**: Shows house name, user name, share link, admin button
- **ChoreList**: Displays all chores (sorted: incomplete first, then by due date)
- **ChoreItem**: Individual chore with:
  - Checkbox (only if assigned to you)
  - Title, assigned member, due date
  - Edit/Delete buttons
- **AddChoreModal**: Add custom chores

### 3. **Admin Page**
```
Click "Admin View" → AdminPage → Shows 5-week schedule table
```

**Features:**
- Complete schedule overview
- All tasks × All 5 weeks
- Color-coded (common areas vs sole responsibility)
- Summary statistics

---

## 📄 File-by-File Breakdown

### **Root Configuration**

| File | Purpose |
|------|---------|
| `package.json` | Defines dependencies (React, Firebase, Vite) and scripts |
| `vite.config.ts` | Build tool config (enables network access for phone testing) |
| `tsconfig.json` | TypeScript compiler settings |
| `firebase.rules` | Firestore security rules (must be published in Firebase Console) |
| `index.html` | HTML entry point |
| `.env` | Firebase credentials (NOT in git, user must create) |

### **Core Application Files**

| File | Purpose |
|------|---------|
| `src/main.tsx` | React app entry point, renders App component |
| `src/App.tsx` | Router setup (HashRouter for static hosting compatibility) |
| `src/index.css` | Global CSS styles |

### **Components**

| Component | Purpose |
|-----------|---------|
| `SetupWizard` | 4-step wizard to create house with members, tasks, and assignments |
| `CreateHouse` | Simple wrapper that renders SetupWizard |
| `HouseHeader` | Top navigation bar with house info, user name, share link, admin button |
| `ChoreList` | Container that subscribes to chores and displays them |
| `ChoreItem` | Individual chore card with checkbox, details, edit/delete |
| `AddChoreModal` | Modal form to add new custom chores |
| `NameModal` | Modal to set/change user's name for the house |

### **Pages**

| Page | Purpose |
|------|---------|
| `HousePage` | Main house view - loads house data, shows ChoreList |
| `AdminPage` | Admin view showing complete 5-week schedule table |

### **Firebase Integration**

| File | Purpose |
|------|---------|
| `config.ts` | Initializes Firebase app, auth, and Firestore (reads from .env) |
| `auth.ts` | Anonymous authentication helper |
| `houses.ts` | House CRUD operations (create, get) |
| `chores.ts` | Chore CRUD operations (create, update, delete, subscribe) |

### **Utilities**

| File | Purpose |
|------|---------|
| `houseCode.ts` | Generates unique 6-character house codes |
| `storage.ts` | localStorage helpers for storing user names per house |
| `taskAssignment.ts` | Groups tasks by location (upstairs/downstairs), assigns to members |

---

## 🔐 Data Flow

### **Firebase Structure**
```
houses/
  {houseCode}/
    - name: string
    - memberCount: number
    - tasks: string[] (common areas)
    - members: string[]
    - soleResponsibilityTasks: string[]
    - commonAreaAssignments: { [task]: [{member, week}] }
    - soleResponsibilityAssignments: { [task]: [{member, week}] }
    - createdAt: Timestamp
    
    chores/ (subcollection)
      {choreId}/
        - title: string
        - assignedTo: string
        - dueDate: string | null
        - isDone: boolean
        - doneAt: string | null
        - isCommonArea: boolean
        - isSoleResponsibility: boolean
        - weeklySchedule: [{member, week}]
        - currentWeek: number
```

### **Local Storage**
- `userName_{houseCode}`: User's name for specific house

---

## 🚀 What's Missing for Publishing

### **Critical Issues:**

1. **❌ No Production Build Configuration**
   - Missing production environment variables setup
   - No build optimization settings
   - No deployment configuration

2. **❌ No Hosting Setup**
   - No deployment scripts
   - No hosting platform configuration (Firebase Hosting, Vercel, Netlify, etc.)
   - No CI/CD pipeline

3. **❌ Environment Variables Not Configured for Production**
   - `.env` file is local only
   - Need production environment variables in hosting platform

4. **❌ Missing Error Boundaries**
   - No error handling for React component crashes
   - Could crash entire app if one component fails

5. **❌ No Loading States**
   - Some async operations don't show loading indicators
   - Poor UX during data fetching

6. **❌ No Offline Support**
   - App requires constant internet connection
   - No service worker or offline caching

7. **❌ Security Concerns**
   - Firestore rules allow any authenticated user to read/write all houses
   - Should restrict access to house members only
   - No rate limiting

8. **❌ No Analytics/Monitoring**
   - No error tracking (Sentry, etc.)
   - No usage analytics
   - Hard to debug production issues

9. **❌ Missing Meta Tags**
   - No Open Graph tags for social sharing
   - No favicon (still using default Vite icon)
   - No SEO optimization

10. **❌ No PWA Features**
    - Can't install as app on phone
    - No app manifest
    - No service worker

### **Nice-to-Have Features:**

1. **Feature Enhancements:**
   - Email notifications for due chores
   - Chore history/statistics
   - Recurring chore templates
   - Chore categories/tags
   - Member profiles/avatars

2. **UX Improvements:**
   - Dark mode
   - Better mobile responsiveness
   - Animations/transitions
   - Keyboard shortcuts

3. **Admin Features:**
   - Edit schedule after creation
   - Export schedule to PDF
   - Member management (add/remove)

---

## 📋 Pre-Publishing Checklist

### **Must Have:**
- [ ] Set up production Firebase project
- [ ] Configure production environment variables
- [ ] Set up hosting (Firebase Hosting, Vercel, or Netlify)
- [ ] Update Firestore security rules (restrict house access)
- [ ] Test production build (`npm run build`)
- [ ] Add error boundaries
- [ ] Update favicon and meta tags
- [ ] Test on multiple devices/browsers
- [ ] Add loading states
- [ ] Set up error monitoring

### **Should Have:**
- [ ] Add PWA support (manifest, service worker)
- [ ] Implement offline support
- [ ] Add analytics
- [ ] Create deployment documentation
- [ ] Set up CI/CD pipeline

### **Nice to Have:**
- [ ] Dark mode
- [ ] Email notifications
- [ ] Export functionality
- [ ] Advanced admin features

---

## 🛠️ Quick Start for Publishing

### **1. Production Build**
```bash
npm run build
```
This creates a `dist/` folder with optimized production files.

### **2. Choose Hosting Platform**

**Option A: Firebase Hosting (Recommended - Free)**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Select dist/ as public directory
firebase deploy
```

**Option B: Vercel (Free)**
```bash
npm install -g vercel
vercel
```

**Option C: Netlify (Free)**
- Drag and drop `dist/` folder to Netlify dashboard
- Or use Netlify CLI

### **3. Environment Variables**
Set these in your hosting platform's environment variables:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### **4. Update Security Rules**
The current rules allow any authenticated user to access any house. Consider:
- Adding house membership validation
- Rate limiting
- Input validation

---

## 📊 Current Status

✅ **Working:**
- Complete setup wizard
- House creation and management
- Chore CRUD operations
- Real-time sync
- Weekly schedule system
- Admin view
- Mobile responsive (basic)

⚠️ **Needs Work:**
- Production deployment setup
- Security rules refinement
- Error handling
- Loading states
- Offline support

❌ **Missing:**
- Production hosting configuration
- Error monitoring
- PWA features
- Analytics

---

## 🎯 Recommended Next Steps

1. **Immediate (Before Publishing):**
   - Set up production hosting
   - Configure production environment variables
   - Test production build thoroughly
   - Add error boundaries
   - Update security rules

2. **Short Term:**
   - Add loading states
   - Implement error monitoring
   - Add PWA support
   - Improve mobile UX

3. **Long Term:**
   - Add notifications
   - Implement offline support
   - Add analytics
   - Feature enhancements

---

## 📝 Notes

- Uses **HashRouter** instead of BrowserRouter for better static hosting compatibility
- All user names stored in **localStorage** (not in Firebase)
- Uses **Firebase Anonymous Auth** (no user accounts needed)
- **Real-time sync** via Firestore listeners
- **5-week rotating schedule** for common areas
- **Sole responsibility tasks** can have custom member selections

