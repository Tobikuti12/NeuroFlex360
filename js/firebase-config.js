// =========================================
//  firebase-config.js
//  NeuroFlex360 | NeuroFlex360
//
//  SETUP INSTRUCTIONS:
//  1. Go to https://console.firebase.google.com
//  2. Create a new project called "neuroflex360"
//  3. Go to Project Settings > General > Your apps
//  4. Click "Add app" > Web (</>)
//  5. Register app, copy the firebaseConfig object below
//  6. Replace the placeholder values with your real config
// =========================================

const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

// Initialise Firebase
firebase.initializeApp(firebaseConfig);

// Make services available globally
const fbAuth = firebase.auth();
const fbDB   = firebase.firestore();

// Enable offline persistence so the app works without internet
fbDB.enablePersistence({ synchronizeTabs: true })
  .catch(function(err) {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence: multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence: not supported in this browser');
    }
  });
