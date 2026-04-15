// =========================================
//  firebase-config.js
//  NeuroFlex360 | Middlesex University Dubai
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
    apiKey: "AIzaSyBRchd7iLVhqGhTuHbT7QlOPDpe2ur8fys",
    authDomain: "neuroflex360-c7e1a.firebaseapp.com",
    projectId: "neuroflex360-c7e1a",
    storageBucket: "neuroflex360-c7e1a.firebasestorage.app",
    messagingSenderId: "825776368689",
    appId: "1:825776368689:web:24f1784beaeb0f5db7b910"
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
