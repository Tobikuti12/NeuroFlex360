// =========================================
//  progress.js – Progress Page Logic
//  NeuroFlex360 | Middlesex University Dubai
//
//  This page reads scores saved by each game module
//  from localStorage and displays them as stats,
//  bar charts, and a clinician report.
// =========================================

// ---------- LOAD DATA FROM LOCALSTORAGE ----------
function loadScores() {
  // Use auth.js to get scores for the currently logged-in user only
  return getUserScores();
}

// ---------- GET AVERAGE ----------
function getAverage(arr) {
  if (!arr || arr.length === 0) return null;
  const total = arr.reduce(function(sum, entry) { return sum + entry.score; }, 0);
  return Math.round(total / arr.length);
}

// ---------- GET LATEST SCORE ----------
function getLatest(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[arr.length - 1].score;
}

// ---------- GET IMPROVEMENT ----------
// Compares latest score to previous score
function getImprovement(arr) {
  if (!arr || arr.length < 2) return null;
  const latest   = arr[arr.length - 1].score;
  const previous = arr[arr.length - 2].score;
  return latest - previous;
}

// ---------- RENDER MODULE ROW ----------
function renderModule(moduleId, data, scoreElId, sessionsElId, changeElId, barElId) {
  const entries = data[moduleId] || [];

  const latest      = getLatest(entries);
  const improvement = getImprovement(entries);

  // Sessions count
  document.getElementById(sessionsElId).textContent = entries.length + ' session' + (entries.length !== 1 ? 's' : '');

  // Score display
  if (latest !== null) {
    const scoreEl = document.getElementById(scoreElId);

    // Reaction time shows ms, others show /100
    if (moduleId === 'reaction') {
      scoreEl.textContent = latest + 'ms';
    } else {
      scoreEl.textContent = latest;
    }
  } else {
    document.getElementById(scoreElId).textContent = '--';
  }

  // Improvement text
  const changeEl = document.getElementById(changeElId);
  if (improvement !== null) {
    if (moduleId === 'reaction') {
      // Lower is better for reaction time
      const better = improvement < 0;
      changeEl.textContent = better
        ? '↓ ' + Math.abs(improvement) + 'ms faster'
        : '↑ ' + improvement + 'ms slower';
      changeEl.style.color = better ? '#3b6d11' : '#a32d2d';
    } else {
      changeEl.textContent = improvement >= 0
        ? '↑ +' + improvement + ' from last session'
        : '↓ ' + improvement + ' from last session';
      changeEl.style.color = improvement >= 0 ? '#3b6d11' : '#a32d2d';
    }
  } else {
    changeEl.textContent = entries.length === 0 ? 'No data yet' : 'First session!';
  }

  // Progress bar width (memory and attention out of 100, reaction capped at 800ms)
  const barEl = document.getElementById(barElId);
  if (latest !== null) {
    let pct;
    if (moduleId === 'reaction') {
      // Faster = higher bar: 200ms = 100%, 800ms = 0%
      pct = Math.max(0, Math.min(100, Math.round((800 - latest) / 6)));
    } else {
      pct = Math.min(100, latest);
    }
    barEl.style.width = pct + '%';
  }
}

// ---------- RENDER SUMMARY STATS ----------
function renderSummary(data) {
  // Total sessions = sum of all entries across all modules
  const totalSessions =
    (data.memory    ? data.memory.length    : 0) +
    (data.attention ? data.attention.length : 0) +
    (data.reaction  ? data.reaction.length  : 0);

  document.getElementById('sum-sessions').textContent = totalSessions;

  // Calculate overall average score (memory + attention only, not reaction ms)
  const memAvg = getAverage(data.memory);
  const attAvg = getAverage(data.attention);
  const both   = [memAvg, attAvg].filter(function(v) { return v !== null; });
  if (both.length > 0) {
    const overall = Math.round(both.reduce(function(a, b) { return a + b; }, 0) / both.length);
    document.getElementById('sum-avg').textContent = overall;
  }
}

// ---------- RENDER BAR CHART (Memory scores over time) ----------
function renderChart(data) {
  const entries  = data.memory || [];
  const chartEl  = document.getElementById('mem-chart');
  const labelsEl = document.getElementById('chart-x-labels');
  const noData   = document.getElementById('no-data-msg');

  if (entries.length === 0) {
    noData.style.display = 'block';
    return;
  }

  noData.style.display = 'none';

  // Use the last 7 entries at most
  const recent = entries.slice(-7);
  const maxScore = Math.max(...recent.map(function(e) { return e.score; }));

  recent.forEach(function(entry, i) {
    // Bar
    const bar = document.createElement('div');
    bar.classList.add('chart-bar');
    const height = Math.max(6, Math.round((entry.score / 100) * 90));
    bar.style.height = height + 'px';
    chartEl.appendChild(bar);

    // X-axis label (just "S1", "S2", etc.)
    const lbl = document.createElement('div');
    lbl.classList.add('chart-x-lbl');
    lbl.textContent = 'S' + (i + 1);
    labelsEl.appendChild(lbl);
  });
}

// ---------- GENERATE CLINICIAN NOTE ----------
function renderClinicianNote(data) {
  const noteEl  = document.getElementById('clinician-note');
  const memData = data.memory    || [];
  const attData = data.attention || [];
  const rtData  = data.reaction  || [];

  // Only generate if there's some data
  if (memData.length === 0 && attData.length === 0 && rtData.length === 0) {
    return; // leave the default placeholder text
  }

  let notes = [];

  // Memory note
  if (memData.length > 0) {
    const memAvg  = getAverage(memData);
    const memLatest = getLatest(memData);
    const memTrend = getImprovement(memData);

    if (memLatest >= 75) {
      notes.push('Memory performance is strong at ' + memLatest + '/100.');
    } else if (memLatest >= 50) {
      notes.push('Memory performance is moderate (' + memLatest + '/100). Continued daily practice is recommended.');
    } else {
      notes.push('Memory performance requires attention (' + memLatest + '/100). Consider increasing session frequency.');
    }

    if (memTrend !== null && memTrend > 0) {
      notes.push('Improvement of +' + memTrend + ' points observed from last session — positive trend.');
    }
  }

  // Attention note
  if (attData.length > 0) {
    const attLatest = getLatest(attData);

    if (attLatest >= 70) {
      notes.push('Attention scores indicate good focus and cognitive selectivity.');
    } else {
      notes.push('Attention training scores (' + attLatest + '/100) suggest difficulty with sustained focus — recommend daily exercises.');
    }
  }

  // Reaction time note
  if (rtData.length > 0) {
    const rtLatest = getLatest(rtData);

    if (rtLatest < 300) {
      notes.push('Reaction time of ' + rtLatest + 'ms is excellent — well above average for this age group.');
    } else if (rtLatest < 500) {
      notes.push('Reaction time of ' + rtLatest + 'ms is within a normal range. Continued reaction training advised.');
    } else {
      notes.push('Reaction time of ' + rtLatest + 'ms is below target. Neuromotor exercises recommended.');
    }
  }

  // Final general note
  notes.push('Clinician note generated on ' + new Date().toLocaleDateString('en-GB') + '.');

  noteEl.textContent = notes.join(' ');
}

// ---------- INIT ----------
function init() {
  const data = loadScores();

  renderSummary(data);

  renderModule('memory',    data, 'mem-score', 'mem-sessions', 'mem-change', 'mem-bar');
  renderModule('attention', data, 'att-score', 'att-sessions', 'att-change', 'att-bar');
  renderModule('reaction',  data, 'rt-score',  'rt-sessions',  'rt-change',  'rt-bar');

  renderChart(data);
  renderClinicianNote(data);
}

window.addEventListener('DOMContentLoaded', function() {
  // Show real streak on progress page
  var streakEl = document.getElementById('sum-streak');
  if (streakEl) {
    var count = getStreak();
    streakEl.textContent = count > 0 ? count : '0';
  }
  init();
});
