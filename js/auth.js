// =========================================
//  auth.js – Firebase Backend
//  NeuroFlex360 | NeuroFlex360
// =========================================

var _currentUser  = null;
var _authReady    = false;
var _cachedScores = {};
var _cachedStreak = { count: 0, lastDate: null };

var DIFFICULTY_LABELS  = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };
var DIFFICULTY_COLOURS = { 1: '#3b6d11', 2: '#ba7517', 3: '#a32d2d' };

function getDifficultyLabel(level) {
  return 'Level ' + level + ' · ' + DIFFICULTY_LABELS[level];
}

// ---- AUTH STATE ----
fbAuth.onAuthStateChanged(function(firebaseUser) {
  _authReady = true;
  if (!firebaseUser) { _currentUser = null; return; }

  fbDB.collection('users').doc(firebaseUser.uid).get()
    .then(function(doc) {
      if (doc.exists) {
        _currentUser    = doc.data();
        _currentUser.id = doc.id;
        loadUserData(firebaseUser.uid);
      } else {
        _currentUser = null;
      }
    });
});

function getCurrentUser() { return _currentUser; }

function requireAuth(redirectTo) {
  redirectTo = redirectTo || 'login.html';

  // Wait up to 3 seconds for Firebase to confirm auth state
  var attempts = 0;
  var check = setInterval(function() {
    attempts++;
    if (_authReady) {
      clearInterval(check);
      if (!fbAuth.currentUser) {
        window.location.href = redirectTo;
      }
    }
    if (attempts > 30) {
      clearInterval(check);
      window.location.href = redirectTo;
    }
  }, 100);

  return _currentUser;
}

// ---- REGISTRATION ----
function registerUser(name, email, password, role, age, medicalCategory, specialisation, institution, licence) {
  return fbAuth.createUserWithEmailAndPassword(email, password)
    .then(function(credential) {
      var uid  = credential.user.uid;
      var user = credential.user;

      // Send Firebase verification email
      return user.sendEmailVerification()
        .then(function() {
          var profile = {
            name:            name,
            email:           email.toLowerCase(),
            role:            role,
            age:             age             || null,
            medicalCategory: medicalCategory || null,
            specialisation:  specialisation  || null,
            institution:     institution     || null,
            licence:         licence         || null,
            verified:        false,
            createdAt:       firebase.firestore.FieldValue.serverTimestamp()
          };
          return fbDB.collection('users').doc(uid).set(profile);
        })
        .then(function() {
          // Sign out immediately — must verify email first
          return fbAuth.signOut();
        })
        .then(function() { return true; });
    })
    .catch(function(err) {
      if (err.code === 'auth/email-already-in-use') return 'An account with this email already exists.';
      if (err.code === 'auth/invalid-email')         return 'Please enter a valid email address.';
      if (err.code === 'auth/weak-password')          return 'Password must be at least 6 characters.';
      return err.message || 'Something went wrong. Please try again.';
    });
}

// ---- LOGIN ----
function loginUser(email, password) {
  return fbAuth.signInWithEmailAndPassword(email, password)
    .then(function(credential) {
      var user = credential.user;

      if (!user.emailVerified) {
        return fbAuth.signOut().then(function() {
          return 'Please verify your email before logging in. Check your inbox for the verification link.';
        });
      }

      return fbDB.collection('users').doc(user.uid).get()
        .then(function(doc) {
          if (!doc.exists) {
            return fbAuth.signOut().then(function() {
              return 'Account profile not found. Please sign up again.';
            });
          }
          _currentUser    = doc.data();
          _currentUser.id = doc.id;

          if (!_currentUser.verified) {
            fbDB.collection('users').doc(user.uid).update({ verified: true });
            _currentUser.verified = true;
          }

          return loadUserData(user.uid).then(function() { return true; });
        });
    })
    .catch(function(err) {
      if (err.code === 'auth/user-not-found'    ||
          err.code === 'auth/wrong-password'     ||
          err.code === 'auth/invalid-credential') {
        return 'Incorrect email or password.';
      }
      if (err.code === 'auth/too-many-requests') {
        return 'Too many attempts. Please wait a few minutes and try again.';
      }
      return err.message || 'Something went wrong. Please try again.';
    });
}

// ---- LOGOUT ----
function logoutUser() {
  _currentUser  = null;
  _cachedScores = {};
  _cachedStreak = { count: 0, lastDate: null };
  sessionStorage.clear();
  fbAuth.signOut().then(function() {
    window.location.href = 'login.html';
  });
}

// ---- PASSWORD RESET ----
function sendPasswordReset(email) {
  return fbAuth.sendPasswordResetEmail(email)
    .then(function() { return true; })
    .catch(function(err) {
      if (err.code === 'auth/user-not-found') return true; // silent — don't reveal
      if (err.code === 'auth/invalid-email')  return 'Please enter a valid email address.';
      return err.message || 'Something went wrong.';
    });
}

// ---- SCORES ----
function getUserScores() { return _cachedScores; }

function _loadScores(uid) {
  // Try sessionStorage first for instant display on refresh
  var cached = sessionStorage.getItem('nf360_scores_' + uid);
  if (cached) {
    try { _cachedScores = JSON.parse(cached); } catch(e) {}
  }

  return fbDB.collection('users').doc(uid).collection('scores').get()
    .then(function(snap) {
      var scores = {};
      snap.forEach(function(doc) { scores[doc.id] = doc.data().sessions || []; });
      _cachedScores = scores;
      // Cache in sessionStorage for next page load
      try { sessionStorage.setItem('nf360_scores_' + uid, JSON.stringify(scores)); } catch(e) {}
      return scores;
    });
}

function saveScoreWithLevel(module, score, level) {
  var user = fbAuth.currentUser;
  if (!user) return;

  var d = new Date();
  var entry = {
    score:     score,
    level:     level,
    date:      d.toISOString(),
    localDate: d.toDateString()   // e.g. "Sat Apr 19 2026" — timezone-safe
  };

  if (!_cachedScores[module]) _cachedScores[module] = [];
  _cachedScores[module].push(entry);
  if (_cachedScores[module].length > 10) _cachedScores[module] = _cachedScores[module].slice(-10);

  var ref = fbDB.collection('users').doc(user.uid).collection('scores').doc(module);
  ref.get().then(function(doc) {
    var sessions = doc.exists ? (doc.data().sessions || []) : [];
    sessions.push(entry);
    if (sessions.length > 10) sessions = sessions.slice(-10);
    return ref.set({ sessions: sessions }, { merge: true });
  }).catch(function(err) { console.error('Error saving score:', err); });
}

// ---- DIFFICULTY ----
function getDifficultyLevel(module) {
  var entries = _cachedScores[module] || [];
  if (entries.length === 0) return 1;
  var last = entries[entries.length - 1].level || 1;
  if (entries.length < 2) return last;
  var recent = entries.slice(-2).map(function(e) { return e.score; });
  if (recent.every(function(s) { return s >= 75; }) && last < 3) return last + 1;
  if (recent.every(function(s) { return s <  50; }) && last > 1) return last - 1;
  return last;
}

function getNextDifficultyLevel(module) { return getDifficultyLevel(module); }

// ---- STREAK ----
function _loadStreak(uid) {
  // Try sessionStorage first
  var cached = sessionStorage.getItem('nf360_streak_' + uid);
  if (cached) {
    try { _cachedStreak = JSON.parse(cached); } catch(e) {}
  }

  return fbDB.collection('users').doc(uid).collection('streak').doc('current').get()
    .then(function(doc) {
      if (doc.exists) _cachedStreak = doc.data();
      try { sessionStorage.setItem('nf360_streak_' + uid, JSON.stringify(_cachedStreak)); } catch(e) {}
      return _cachedStreak;
    });
}

function getStreak() {
  var today     = new Date().toDateString();
  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (_cachedStreak.lastDate !== today &&
      _cachedStreak.lastDate !== yesterday.toDateString()) return 0;
  return _cachedStreak.count || 0;
}

function updateStreak() {
  var user  = fbAuth.currentUser;
  if (!user) return;

  var today   = new Date().toDateString();
  var streak  = Object.assign({}, _cachedStreak);
  if (streak.lastDate === today) return streak.count;

  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  streak.count   = streak.lastDate === yesterday.toDateString() ? (streak.count || 0) + 1 : 1;
  streak.lastDate = today;
  _cachedStreak   = streak;

  fbDB.collection('users').doc(user.uid).collection('streak').doc('current')
      .set(streak)
      .catch(function(err) { console.error('Error saving streak:', err); });

  return streak.count;
}

// ---- LOAD ALL DATA after login ----
function loadUserData(uid) {
  return Promise.all([ _loadScores(uid), _loadStreak(uid) ]);
}

// ---- REMEMBER ME (localStorage only — UI convenience) ----
function getRemembered()          { return JSON.parse(localStorage.getItem('nf360_remember') || 'null'); }
function setRemembered(name, em)  { localStorage.setItem('nf360_remember', JSON.stringify({ name: name, email: em })); }
function clearRemembered()        { localStorage.removeItem('nf360_remember'); }

// ---- ONBOARDING FLAG (localStorage only) ----
function hasCompletedOnboarding() {
  var u = fbAuth.currentUser;
  return u ? localStorage.getItem('nf360_onboarded_' + u.uid) === 'true' : false;
}
function markOnboardingComplete() {
  var u = fbAuth.currentUser;
  if (u) localStorage.setItem('nf360_onboarded_' + u.uid, 'true');
}

// ---- THERAPIST: GET PATIENTS ----
function getAllPatients() {
  return fbDB.collection('users').where('role', '==', 'patient').get()
    .then(function(snap) {
      var list = [];
      snap.forEach(function(doc) { var d = doc.data(); d.id = doc.id; list.push(d); });
      return list;
    });
}

function getPatientScores(uid) {
  return fbDB.collection('users').doc(uid).collection('scores').get()
    .then(function(snap) {
      var scores = {};
      snap.forEach(function(doc) { scores[doc.id] = doc.data().sessions || []; });
      return scores;
    });
}

function getPatientStreak(uid) {
  return fbDB.collection('users').doc(uid).collection('streak').doc('current').get()
    .then(function(doc) {
      if (!doc.exists) return { count: 0, lastDate: null };
      var s = doc.data(), today = new Date().toDateString();
      var yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      if (s.lastDate !== today && s.lastDate !== yesterday.toDateString()) return { count: 0, lastDate: s.lastDate };
      return s;
    });
}
