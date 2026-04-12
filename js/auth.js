// =========================================
//  auth.js – Simple Multi-User System
//  NeuroFlex360 | Middlesex University Dubai
//
//  Stores all users in localStorage.
//  Each user has their own scores.
//  No backend needed yet — prototype only.
// =========================================

// Get all registered users
function getUsers() {
  return JSON.parse(localStorage.getItem('nf360_users') || '[]');
}

// Get the currently logged-in user
function getCurrentUser() {
  var id = localStorage.getItem('nf360_current');
  if (!id) return null;
  return getUsers().find(function(u) { return u.id === id; }) || null;
}

// Register a new user — returns true or an error message
function registerUser(name, email, password, role, age, medicalCategory, specialisation, institution, licence) {
  var users = getUsers();

  var taken = users.find(function(u) {
    return u.email.toLowerCase() === email.toLowerCase();
  });

  if (taken) return 'An account with this email already exists.';

  var newUser = {
    id:        Date.now().toString(),
    name:      name,
    email:     email.toLowerCase(),
    password:  password,
    role:      role,
    age:             age             || null,
    medicalCategory: medicalCategory || null,
    specialisation:  specialisation  || null,
    institution:     institution     || null,
    licence:         licence         || null,
    createdAt:       new Date().toISOString()
  };

  users.push(newUser);
  localStorage.setItem('nf360_users', JSON.stringify(users));

  // Log them in straight away
  localStorage.setItem('nf360_current', newUser.id);
  return true;
}

// Log in — returns true or an error message
function loginUser(email, password) {
  var users = getUsers();
  var user  = users.find(function(u) {
    return u.email.toLowerCase() === email.toLowerCase() && u.password === password;
  });

  if (!user) return 'Incorrect email or password.';

  localStorage.setItem('nf360_current', user.id);
  return true;
}

// Log out
function logoutUser() {
  localStorage.removeItem('nf360_current');
  window.location.href = 'login.html';
}

// Redirect to login if not signed in
function requireAuth() {
  var user = getCurrentUser();
  if (!user) { window.location.href = 'login.html'; return null; }
  return user;
}

// Get scores for the current user only
function getUserScores() {
  var user = getCurrentUser();
  if (!user) return {};
  return JSON.parse(localStorage.getItem('nf360_scores_' + user.id) || '{}');
}

// Save scores for the current user only
function saveUserScores(data) {
  var user = getCurrentUser();
  if (!user) return;
  localStorage.setItem('nf360_scores_' + user.id, JSON.stringify(data));
}

// ---- Difficulty helpers (used by all game pages) ----
var DIFFICULTY_LABELS  = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };
var DIFFICULTY_COLOURS = { 1: '#3b6d11', 2: '#ba7517', 3: '#a32d2d' };

function getDifficultyLabel(level) {
  return 'Level ' + level + ' · ' + DIFFICULTY_LABELS[level];
}

function getDifficultyLevel(module) {
  var data    = getUserScores();
  var entries = data[module] || [];

  // First session ever — start at Level 1
  if (entries.length === 0) return 1;

  var last = entries[entries.length - 1].level || 1;

  // Need at least 2 sessions to judge
  if (entries.length < 2) return last;

  // Look at the last 2 sessions
  var recent = entries.slice(-2).map(function(e) { return e.score; });

  // Both above 75 — step up
  if (recent.every(function(s) { return s >= 75; }) && last < 3) return last + 1;

  // Both below 50 — step down
  if (recent.every(function(s) { return s <  50; }) && last > 1) return last - 1;

  return last;
}

// Returns the level the NEXT session should use (call after saving score)
function getNextDifficultyLevel(module) {
  return getDifficultyLevel(module);
}

function saveScoreWithLevel(module, score, level) {
  var data = getUserScores();
  if (!data[module]) data[module] = [];
  data[module].push({ score: score, level: level, date: new Date().toISOString() });
  if (data[module].length > 10) data[module] = data[module].slice(-10);
  saveUserScores(data);
}

// =========================================
//  STREAK TRACKING
//  A streak day = at least one module completed that day.
//  Saved per user under nf360_streak_[userId]
// =========================================

function getStreakData() {
  var user = getCurrentUser();
  if (!user) return { count: 0, lastDate: null };
  return JSON.parse(localStorage.getItem('nf360_streak_' + user.id) || '{"count":0,"lastDate":null}');
}

function saveStreakData(data) {
  var user = getCurrentUser();
  if (!user) return;
  localStorage.setItem('nf360_streak_' + user.id, JSON.stringify(data));
}

// Call this whenever a session is completed
function updateStreak() {
  var today  = new Date().toDateString();
  var streak = getStreakData();

  if (streak.lastDate === today) {
    // Already logged today — no change needed
    return streak.count;
  }

  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  var wasYesterday = streak.lastDate === yesterday.toDateString();

  if (wasYesterday) {
    // Continued streak
    streak.count += 1;
  } else {
    // Streak broken or first time — reset to 1
    streak.count = 1;
  }

  streak.lastDate = today;
  saveStreakData(streak);
  return streak.count;
}

function getStreak() {
  var today  = new Date().toDateString();
  var streak = getStreakData();

  // If last activity wasn't today or yesterday, streak is broken
  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (streak.lastDate !== today && streak.lastDate !== yesterday.toDateString()) {
    return 0;
  }
  return streak.count;
}
