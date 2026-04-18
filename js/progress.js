// =========================================
//  progress.js – Progress Page
//  NeuroFlex360
//
//  FIX: Reads from _cachedScores (populated
//  by loadUserData() after Firestore fetch)
//  not from getUserScores() which returns {}
//  before Firebase has finished loading.
// =========================================

function getAverage(arr) {
  if (!arr || arr.length === 0) return null;
  return Math.round(arr.reduce(function(s, e) { return s + e.score; }, 0) / arr.length);
}

function getLatestScore(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[arr.length - 1].score;
}

function getImprovement(arr) {
  if (!arr || arr.length < 2) return null;
  return arr[arr.length - 1].score - arr[arr.length - 2].score;
}

function renderModule(moduleId, data, scoreElId, sessionsElId, changeElId, barElId) {
  var entries     = data[moduleId] || [];
  var latest      = getLatestScore(entries);
  var improvement = getImprovement(entries);

  document.getElementById(sessionsElId).textContent =
    entries.length + ' session' + (entries.length !== 1 ? 's' : '');

  if (latest !== null) {
    document.getElementById(scoreElId).textContent =
      moduleId === 'reaction' ? latest + 'ms' : latest;
  } else {
    document.getElementById(scoreElId).textContent = '--';
    document.getElementById(scoreElId).nextElementSibling &&
      (document.getElementById(scoreElId).parentElement.querySelector('.mr-change').textContent = 'No data yet');
  }

  var changeEl = document.getElementById(changeElId);
  if (improvement !== null) {
    if (moduleId === 'reaction') {
      var faster = improvement < 0;
      changeEl.textContent = faster
        ? '↓ ' + Math.abs(improvement) + 'ms faster'
        : '↑ ' + improvement + 'ms slower';
      changeEl.style.color = faster ? '#4ecca3' : '#ef4444';
    } else {
      changeEl.textContent = improvement >= 0
        ? '↑ +' + improvement + ' from last'
        : '↓ ' + improvement + ' from last';
      changeEl.style.color = improvement >= 0 ? '#4ecca3' : '#ef4444';
    }
  } else {
    changeEl.textContent = entries.length === 0 ? 'No data yet' : 'First session!';
    changeEl.style.color = 'var(--text2)';
  }

  var barEl = document.getElementById(barElId);
  if (latest !== null) {
    var pct = moduleId === 'reaction'
      ? Math.max(0, Math.min(100, Math.round((800 - latest) / 6)))
      : Math.min(100, latest);
    // Animate bar with a tiny delay
    setTimeout(function() { barEl.style.width = pct + '%'; }, 150);
  }
}

function renderSummary(data) {
  var total =
    (data.memory    ? data.memory.length    : 0) +
    (data.attention ? data.attention.length : 0) +
    (data.reaction  ? data.reaction.length  : 0);

  document.getElementById('sum-sessions').textContent = total;

  var memAvg = getAverage(data.memory);
  var attAvg = getAverage(data.attention);
  var both   = [memAvg, attAvg].filter(function(v) { return v !== null; });
  if (both.length > 0) {
    var overall = Math.round(both.reduce(function(a, b) { return a + b; }, 0) / both.length);
    document.getElementById('sum-avg').textContent = overall;
  } else {
    document.getElementById('sum-avg').textContent = '--';
  }

  var streak = getStreak();
  document.getElementById('sum-streak').textContent = streak > 0 ? streak : '0';
}

function renderChart(data) {
  var entries  = data.memory || [];
  var chartEl  = document.getElementById('mem-chart');
  var labelsEl = document.getElementById('chart-x-labels');
  var noData   = document.getElementById('no-data-msg');

  if (entries.length === 0) {
    if (noData) noData.style.display = 'block';
    return;
  }
  if (noData) noData.style.display = 'none';

  var recent = entries.slice(-7);
  chartEl.querySelectorAll('.chart-bar').forEach(function(b) { b.remove(); });
  labelsEl.innerHTML = '';

  recent.forEach(function(entry, i) {
    var bar = document.createElement('div');
    bar.classList.add('chart-bar');
    bar.style.height = '0px'; // start at 0 for animation
    chartEl.appendChild(bar);

    var lbl = document.createElement('div');
    lbl.classList.add('chart-x-lbl');
    lbl.textContent = 'S' + (i + 1);
    labelsEl.appendChild(lbl);

    // Animate bar up
    var targetH = Math.max(6, Math.round((entry.score / 100) * 90));
    setTimeout(function() { bar.style.height = targetH + 'px'; }, 100 + i * 60);
  });
}

function renderTherapistNote(data) {
  var noteEl  = document.getElementById('clinician-note');
  var memData = data.memory    || [];
  var attData = data.attention || [];
  var rtData  = data.reaction  || [];

  if (memData.length === 0 && attData.length === 0 && rtData.length === 0) return;

  var notes = [];

  if (memData.length > 0) {
    var ml = getLatestScore(memData);
    notes.push(ml >= 75
      ? 'Memory performance is strong at ' + ml + '/100.'
      : ml >= 50
        ? 'Memory performance is moderate (' + ml + '/100). Continued daily practice is recommended.'
        : 'Memory performance requires attention (' + ml + '/100). Consider increasing session frequency.');
    var mt = getImprovement(memData);
    if (mt !== null && mt > 0)
      notes.push('Improvement of +' + mt + ' points observed from last session — positive trend.');
  }

  if (attData.length > 0) {
    var al = getLatestScore(attData);
    notes.push(al >= 70
      ? 'Attention scores indicate good focus and cognitive selectivity.'
      : 'Attention scores (' + al + '/100) suggest difficulty with sustained focus — daily exercises recommended.');
  }

  if (rtData.length > 0) {
    var rl = getLatestScore(rtData);
    notes.push(rl < 300
      ? 'Reaction time of ' + rl + 'ms is excellent.'
      : rl < 500
        ? 'Reaction time of ' + rl + 'ms is within normal range.'
        : 'Reaction time of ' + rl + 'ms is below target. Neuromotor exercises recommended.');
  }

  notes.push('Therapist note generated on ' + new Date().toLocaleDateString('en-GB') + '.');
  noteEl.textContent = notes.join(' ');
}

// ---- INIT — waits for Firebase data to be loaded ----
function initProgress() {
  fbAuth.onAuthStateChanged(function(firebaseUser) {
    if (!firebaseUser || !firebaseUser.emailVerified) {
      window.location.href = '../welcome.html';
      return;
    }

    // Load profile to check role, then load scores
    fbDB.collection('users').doc(firebaseUser.uid).get().then(function(doc) {
      if (!doc.exists) { window.location.href = '../welcome.html'; return; }

      var profile = doc.data();
      // Therapists go to their own dashboard
      if (profile.role === 'clinician' || profile.role === 'therapist') {
        window.location.href = 'clinician.html';
        return;
      }

      _currentUser    = profile;
      _currentUser.id = doc.id;

      return loadUserData(firebaseUser.uid).then(function() {
        var data = _cachedScores;

        renderSummary(data);
        renderModule('memory',    data, 'mem-score', 'mem-sessions', 'mem-change', 'mem-bar');
        renderModule('attention', data, 'att-score', 'att-sessions', 'att-change', 'att-bar');
        renderModule('reaction',  data, 'rt-score',  'rt-sessions',  'rt-change',  'rt-bar');
        renderChart(data);
        renderTherapistNote(data);

        document.body.classList.add('ready');
      });
    });
  });
}

window.addEventListener('DOMContentLoaded', initProgress);
