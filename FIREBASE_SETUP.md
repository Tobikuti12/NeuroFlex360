# NeuroFlex360 — Firebase Backend Setup Guide
# Middlesex University Dubai | CST3990
# ==========================================

This guide walks you through connecting NeuroFlex360 to Firebase.
It takes about 20–30 minutes start to finish.

---

## WHAT FIREBASE GIVES YOU

- Firebase Authentication — handles login, registration,
  email verification, and password reset. No code needed for emails.
- Firestore Database — stores every user's profile, scores, and streak.
- Security Rules — controls who can read/write what data.
- Everything is free up to generous limits (plenty for a student project).

---

## STEP 1 — CREATE THE FIREBASE PROJECT

1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Name it: neuroflex360
4. Disable Google Analytics (not needed)
5. Click "Create project"

---

## STEP 2 — ENABLE FIREBASE AUTHENTICATION

1. In the Firebase Console, go to Build > Authentication
2. Click "Get started"
3. Under "Sign-in method", click "Email/Password"
4. Enable "Email/Password" (first toggle)
5. Also enable "Email link (passwordless sign-in)" — OFF, leave it off
6. Click Save

---

## STEP 3 — CREATE THE FIRESTORE DATABASE

1. Go to Build > Firestore Database
2. Click "Create database"
3. Choose "Start in production mode"
4. Pick a server location close to your users
   (for Dubai: europe-west1 or asia-south1 are closest)
5. Click "Enable"

---

## STEP 4 — DEPLOY SECURITY RULES

Option A — Firebase CLI (recommended):

  npm install -g firebase-tools
  firebase login
  firebase init firestore   (select your project)
  # Copy the contents of firestore.rules into the rules file
  firebase deploy --only firestore:rules

Option B — Firebase Console:
  Go to Firestore > Rules tab
  Paste the contents of firestore.rules
  Click "Publish"

---

## STEP 5 — GET YOUR CONFIG AND UPDATE firebase-config.js

1. In Firebase Console, click the gear icon > Project settings
2. Scroll down to "Your apps"
3. Click "Add app" > Web (</>)
4. Register the app (any nickname, e.g. "neuroflex-web")
5. Copy the firebaseConfig object — it looks like this:

   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "neuroflex360.firebaseapp.com",
     projectId: "neuroflex360",
     storageBucket: "neuroflex360.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };

6. Open js/firebase-config.js and replace the placeholder values
   with your real values. That is the ONLY file you need to change.

---

## STEP 6 — TEST LOCALLY

Open welcome.html in a browser (use a local server, not file://).

Quick local server options:
  Python:  python3 -m http.server 8000
  Node:    npx serve .
  VS Code: install "Live Server" extension, right-click welcome.html > Open with Live Server

Then go to http://localhost:8000/welcome.html

---

## STEP 7 — DEPLOY THE APP (optional but recommended)

Firebase Hosting is free and very easy:

  npm install -g firebase-tools
  firebase login
  firebase init hosting
    - Select your neuroflex360 project
    - Public directory: . (just press Enter)
    - Single-page app: No
    - Overwrite index.html: No
  firebase deploy --only hosting

Your app will be live at:
  https://neuroflex360.web.app

---

## HOW THE DATA IS STORED IN FIRESTORE

users/
  {userId}/                    ← one doc per user
    name: "Tobi Kuti"
    email: "tobi@example.com"
    role: "patient"
    age: 22
    medicalCategory: "stroke"
    verified: true
    createdAt: timestamp

    scores/                    ← subcollection
      memory/                  ← one doc per module
        sessions: [
          { score: 78, level: 1, date: "2026-04-12T..." },
          { score: 82, level: 1, date: "2026-04-13T..." }
        ]
      attention/
        sessions: [...]
      reaction/
        sessions: [...]

    streak/
      current/
        count: 5
        lastDate: "Mon Apr 14 2026"

---

## PASSWORDS

Firebase Authentication stores passwords securely on Google's servers.
Passwords are NEVER stored in Firestore. Not even encrypted.
The Firestore security rules reflect this — there is no password field to protect.

---

## EMAIL VERIFICATION

Firebase sends the verification email automatically when registerUser() is called.
The email comes from no-reply@neuroflex360.firebaseapp.com by default.

To use your own domain (e.g. no-reply@neuroflex360.com):
  Firebase Console > Authentication > Templates > Edit > Customise domain

---

## PASSWORD RESET

Firebase sends the reset email automatically when sendPasswordReset() is called.
The user clicks a link in the email that takes them to a Firebase-hosted reset page.
You do not need to build or host anything for this to work.

---

## WHAT YOU NO LONGER NEED

- verify-code.html is now just a redirect (Firebase handles codes internally)
- The nf360_users, nf360_current, nf360_scores_* localStorage keys
  are no longer used for real data. Only nf360_remember and
  nf360_onboarded_* remain in localStorage (they are UI flags, not data).

---

## TROUBLESHOOTING

"Firebase is not defined"
  → Make sure the Firebase SDK scripts load BEFORE firebase-config.js and auth.js

"permission-denied from Firestore"
  → Check your security rules are deployed correctly

"auth/operation-not-allowed"
  → Email/Password sign-in is not enabled in Firebase Console

Emails not arriving
  → Check spam folder. For production, set up a custom email domain in
    Firebase Console > Authentication > Templates

---

## NEXT STEPS FOR YOUR DISSERTATION

When writing up the backend implementation in your report:

- Firebase Authentication handles: registration, login, email verification,
  password reset, session management (JWT tokens)
- Firestore handles: user profiles, session scores, streaks
- Security rules enforce: each user can only access their own data;
  therapists can read patient data but never credentials
- Data is stored in a document-oriented NoSQL structure with subcollections
- Firebase SDKs provide offline persistence — the app works without internet
  and syncs when connection is restored

Reference: Firebase Documentation — https://firebase.google.com/docs
