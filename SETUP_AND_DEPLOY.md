# Mystery Games Framework - Deployment & Setup Guide

This guide details the steps to deploy this application to a fresh Google Cloud Project using Firebase Authentication and Firestore.

## Prerequisites
1. **Google Cloud Account**: [Create one here](https://console.cloud.google.com/).
2. **Node.js & npm**: Installed locally.
3. **Firebase CLI**: Install via `npm install -g firebase-tools`.

---

## Step 1: Create a Google Cloud & Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add project"**.
3. Enter a project name (e.g., `mystery-framework-prod`).
4. (Optional) Disable Google Analytics to simplify setup.
5. Click **"Create project"**.
6. Once created, click **"Continue"** to enter the dashboard.

---

## Step 2: Register the Web App & Get Credentials

1. In the Firebase Project Dashboard, click the **Web icon** (`</>`) to register an app.
2. App Nickname: `Mystery App`.
3. Check the box **"Also set up Firebase Hosting for this app"** (Recommended).
4. Click **"Register app"**.
5. You will see a `const firebaseConfig` object. **Copy these values**.

### Update Environment Variables
1. Open the `.env` file in your project root.
2. Replace the existing values with your new configuration:

```env
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```

---

## Step 3: Enable Firebase Services

### 1. Authentication
1. Go to **Build > Authentication** in the sidebar.
2. Click **"Get started"**.
3. Select **Google** as a Sign-in provider.
4. Enable it and set the **Project support email**.
5. Click **Save**.

### 2. Firestore Database
1. Go to **Build > Firestore Database**.
2. Click **"Create database"**.
3. Choose a location (e.g., `nam5 (us-central)`).
4. Start in **Production mode**.
5. Click **Create**.

### 3. Storage (Optional for images)
1. Go to **Build > Storage**.
2. Click **"Get started"**.
3. Start in **Production mode**.
4. Click **Done**.

---

## Step 4: Configure Security Rules

To enforce the "Admin" and "User" logic, we need to set up Firestore Security Rules.

1. Create a file named `firestore.rules` in your project root (if it doesn't exist) with the following content:

```proto
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is Admin
    function isAdmin() {
      return request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "Admin";
    }

    // Helper function to check if user is Owner
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }

    // USERS COLLECTION
    // Admins can read/write all. Users can read/write their own.
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow write: if isAdmin(); // Only Admins can change roles
      allow update: if isOwner(userId) && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['displayName', 'photoURL']); // Users can update profile basics
    }

    // CASES COLLECTION
    match /cases/{caseId} {
      // Admins have full access
      allow read, write: if isAdmin();
      
      // Users can read if published AND they are assigned (or assigned list is empty/missing logic handled in app, but strict here)
      // Note: Complex "assigned" logic often requires app-level filtering or advanced rules. 
      // For simplicity, we allow authenticated read for published cases:
      allow read: if request.auth != null && resource.data.status == 'published';
    }
  }
}
```

2. Deploy these rules explicitly later, or copy-paste them into the **Firestore > Rules** tab in the console.

---

## Step 5: Initialize Admin User

Since the app restricts actions to 'Admin' users, and you are starting fresh, you need to manually promote your first user.

1. **Run the App Locally**:
   ```bash
   npm install
   npm run dev
   ```
2. **Login**: Open the app and log in with your Google account.
3. **Open Firestore Console**: Go to the Firebase Console > Firestore Database.
4. **Find your User**: Look in the `users` collection for your document (ID is your User UID).
5. **Update Role**:
   - Change the `role` field from `"User"` to `"Admin"`.
   - (If the field doesn't exist, Add Field `role` with value `Admin`).
6. **Refresh App**: You should now have access to the Admin Console and Dashboard creation tools.

> **Note on Seeding**: The "Seed Sample" button in `Dashboard.jsx` is currently hardcoded to `gaurav.pilay@gmail.com`. You should edit `src/pages/Dashboard.jsx` to search for your own email or remove that check to allow all Admins to seed data.

---

## Step 6: Deploy to the Web

We recommend using **Firebase Hosting** for the easiest deployment.

1. **Login to Firebase CLI**:
   ```bash
   firebase login
   ```

2. **Initialize Project**:
   ```bash
   firebase init
   ```
   - **Which features?**: Select `Hosting: Configure files for Firebase Hosting...` (Space to select, Enter to confirm).
   - **Use an existing project**: Select the project you created in Step 1.
   - **Public directory**: `dist` (Vite builds to 'dist' by default).
   - **Configure as a single-page app?**: `Yes`.
   - **Set up automatic builds and deploys with GitHub?**: `No` (unless you want that).

3. **Build the App**:
   ```bash
   npm run build
   ```

4. **Deploy**:
   ```bash
   firebase deploy
   ```

5. **Done!**
   The terminal will output a **Hosting URL** (e.g., `https://mystery-framework-prod.web.app`).

---

## Alternative: Cloud Run Deployment

If you prefer using Google Cloud Run (as seen in `deploy.sh`), you must have the Google Cloud SDK installed.

1. **Configure Project**:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```
2. **Enable APIs**:
   ```bash
   gcloud services enable cloudbuild.googleapis.com run.googleapis.com
   ```
3. **Execute Script**:
   ```bash
   ./deploy.sh
   ```
   *Note: This builds a Docker container and serves it via Nginx. This is more complex and incurs more cost than Firebase Hosting.*
