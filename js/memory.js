// =========================================
//  memory.js – Memory Module (Adaptive)
//  NeuroFlex360 | Middlesex University Dubai
//
//  Three task types rotate based on level:
//  1. Card Matching   – flip emoji pairs (all levels)
//  2. Sequence Recall – Simon-style pattern repeat (L2+)
//  3. Spatial Memory  – remember grid positions (L3)
// =========================================

var LEVEL_CONFIG = {
  1: { pairs: 6,  cols: 4, time: 90, seqLen: 3, gridSize: 3 },
  2: { pairs: 8,  cols: 4, time: 70, seqLen: 4, gridSize: 3 },
  3: { pairs: 10, cols: 5, time: 50, seqLen: 6, gridSize: 4 }
};

var ALL_EMOJIS  = ['🍎','🌟','🐶','🌸','🎈','🏆','🦋','🎵','🌈','🍀'];
var SEQ_COLOURS = ['#378add','#4ecca3','#ba7517','#a32d2d'];

var currentLevel  = 1;
var currentTask   = 'cards';
var taskScore     = 0;

// card state
var flippedCards = [], matchedCount = 0, moveCount = 0;
var isLocked = false, timerInterval = null, secondsLeft = 90, totalPairs = 6;

// sequence state
var seqPattern = [], seqUserInput = [], seqStep = 0, seqIsShowing = false;

// spatial state
var spatialPattern = [], spatialSelected = [], spatialGridSize = 3;

// ---- INIT ----
window.addEventListener('DOMContentLoaded', function() {
  currentLevel = getDifficultyLevel('memory');

  var badge = document.getElementById('difficulty-badge');
  if (badge) {
    badge.textContent = getDifficultyLabel(currentLevel);
    badge.style.color = DIFFICULTY_COLOURS[currentLevel];
  }

  if (currentLevel === 1) {
    startCardTask();
  } else {
    showTaskSelector();
  }
});

// ---- TASK SELECTOR ----
function showTaskSelector() {
  var tasks = ['cards'];
  if (currentLevel >= 2) tasks.push('sequence');
  if (currentLevel >= 3) tasks.push('spatial');

  var info = {
    cards:    { icon:'🃏', label:'Card Matching',   desc:'Find matching pairs before time runs out' },
    sequence: { icon:'🔢', label:'Sequence Recall', desc:'Watch a pattern light up, then repeat it in order' },
    spatial:  { icon:'📍', label:'Spatial Memory',  desc:'Remember which grid positions were highlighted' }
  };

  var html = '<div style="padding:8px 0;">' +
    '<p style="font-size:14px;color:var(--muted);text-align:center;margin-bottom:16px;">Choose a task to train your memory:</p>';

  tasks.forEach(function(t) {
    html += '<div onclick="selectTask(\'' + t + '\')" style="display:flex;align-items:center;gap:14px;background:var(--surface);border:1.5px solid var(--border);border-radius:14px;padding:16px;margin-bottom:12px;cursor:pointer;text-align:left;transition:border-color 0.2s;" onmouseover="this.style.borderColor=\'var(--accent)\'" onmouseout="this.style.borderColor=\'var(--border)\'">' +
      '<div style="font-size:30px;width:50px;height:50px;background:var(--bg);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' + info[t].icon + '</div>' +
      '<div><div style="font-size:15px;font-weight:600;color:var(--text);">' + info[t].label + '</div>' +
      '<div style="font-size:12px;color:var(--muted);margin-top:3px;">' + info[t].desc + '</div></div>' +
      '</div>';
  });

  html += '</div>';
  document.getElementById('game-view').innerHTML = html;
}

function selectTask(task) {
  currentTask = task;
  taskScore   = 0;
  if (task === 'cards')    startCardTask();
  if (task === 'sequence') startSequenceTask();
  if (task === 'spatial')  startSpatialTask();
}

// ============================================================
//  TASK 1 — CARD MATCHING
// ============================================================
function startCardTask() {
  currentTask  = 'cards';
  var cfg      = LEVEL_CONFIG[currentLevel];
  totalPairs   = cfg.pairs;
  secondsLeft  = cfg.time;
  flippedCards = [];
  matchedCount = 0;
  moveCount    = 0;
  isLocked     = false;

  updateStats();

  document.getElementById('game-view').innerHTML =
    '<p class="instruction-text">Tap two cards to reveal them. Find all matching pairs!</p>' +
    '<div class="memory-grid" id="memory-grid"></div>';

  var emojis = ALL_EMOJIS.slice(0, totalPairs);
  var deck   = emojis.concat(emojis);
  shuffleArray(deck);

  var grid = document.getElementById('memory-grid');
  grid.style.gridTemplateColumns = 'repeat(' + cfg.cols + ', 1fr)';

  deck.forEach(function(emoji) {
    var card = document.createElement('div');
    card.classList.add('mem-card');
    card.dataset.value = emoji;
    var face = document.createElement('span');
    face.classList.add('card-face');
    face.textContent = emoji;
    card.appendChild(face);
    card.addEventListener('click', function() { handleCardClick(card); });
    grid.appendChild(card);
  });

  startTimer();
}

function handleCardClick(card) {
  if (isLocked || card.classList.contains('flipped') || card.classList.contains('matched')) return;
  if (flippedCards.length >= 2) return;
  card.classList.add('flipped');
  flippedCards.push(card);
  if (flippedCards.length === 2) { moveCount++; updateStats(); checkForMatch(); }
}

function checkForMatch() {
  var c1 = flippedCards[0], c2 = flippedCards[1];
  if (c1.dataset.value === c2.dataset.value) {
    c1.classList.add('matched'); c2.classList.add('matched');
    matchedCount++; updateStats(); flippedCards = [];
    if (matchedCount === totalPairs) { clearInterval(timerInterval); setTimeout(showResult, 500); }
  } else {
    isLocked = true;
    c1.classList.add('wrong-flash'); c2.classList.add('wrong-flash');
    setTimeout(function() {
      c1.classList.remove('flipped','wrong-flash');
      c2.classList.remove('flipped','wrong-flash');
      flippedCards = []; isLocked = false;
    }, 900);
  }
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(function() {
    secondsLeft--;
    var el = document.getElementById('stat-timer');
    if (el) { el.textContent = secondsLeft; if (secondsLeft <= 10) el.style.color = '#f87171'; }
    if (secondsLeft <= 0) { clearInterval(timerInterval); showResult(); }
  }, 1000);
}

function updateStats() {
  var mv = document.getElementById('stat-moves');
  var pr = document.getElementById('stat-pairs');
  var tm = document.getElementById('stat-timer');
  if (mv) mv.textContent = moveCount;
  if (pr) pr.textContent = matchedCount + ' / ' + totalPairs;
  if (tm) tm.textContent = secondsLeft;
}

// ============================================================
//  TASK 2 — SEQUENCE RECALL (Simon-style)
// ============================================================
function startSequenceTask() {
  if (timerInterval) clearInterval(timerInterval);
  currentTask  = 'sequence';
  seqPattern   = [];
  seqUserInput = [];
  seqStep      = 0;
  seqIsShowing = false;

  var cfg = LEVEL_CONFIG[currentLevel];
  for (var i = 0; i < cfg.seqLen; i++) {
    seqPattern.push(Math.floor(Math.random() * SEQ_COLOURS.length));
  }

  document.getElementById('game-view').innerHTML =
    '<p class="instruction-text" id="seq-instr">Watch the pattern, then repeat it</p>' +
    '<div style="display:flex;justify-content:center;align-items:center;height:100px;margin:8px 0;">' +
      '<div id="seq-flash" style="width:80px;height:80px;border-radius:50%;background:var(--border);transition:background 0.1s;"></div>' +
    '</div>' +
    '<div id="seq-btns" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;opacity:0.3;pointer-events:none;">' +
      SEQ_COLOURS.map(function(col, i) {
        return '<button id="sb' + i + '" onclick="seqTap(' + i + ')" style="height:72px;border-radius:14px;border:3px solid transparent;background:' + col + ';cursor:pointer;transition:transform 0.1s,border-color 0.15s;"></button>';
      }).join('') +
    '</div>' +
    '<p id="seq-prog" style="text-align:center;font-size:13px;color:var(--muted);"></p>';

  setTimeout(playSequence, 800);
}

function playSequence() {
  seqIsShowing = true;
  var instrEl  = document.getElementById('seq-instr');
  var btnsEl   = document.getElementById('seq-btns');
  if (instrEl) instrEl.textContent = 'Watch the pattern…';
  if (btnsEl)  { btnsEl.style.opacity = '0.3'; btnsEl.style.pointerEvents = 'none'; }

  var i = 0;
  function showNext() {
    if (i >= seqPattern.length) {
      seqIsShowing = false;
      seqUserInput = []; seqStep = 0;
      if (instrEl) instrEl.textContent = 'Now repeat the pattern — tap in order';
      if (btnsEl)  { btnsEl.style.opacity = '1'; btnsEl.style.pointerEvents = 'auto'; }
      var prog = document.getElementById('seq-prog');
      if (prog) prog.textContent = 'Tap 1 of ' + seqPattern.length;
      return;
    }
    var col    = SEQ_COLOURS[seqPattern[i]];
    var flash  = document.getElementById('seq-flash');
    var btn    = document.getElementById('sb' + seqPattern[i]);
    if (flash) flash.style.background = col;
    if (btn)   { btn.style.transform = 'scale(1.1)'; btn.style.borderColor = 'white'; }
    setTimeout(function() {
      if (flash) flash.style.background = 'var(--border)';
      if (btn)   { btn.style.transform = 'scale(1)'; btn.style.borderColor = 'transparent'; }
      i++;
      setTimeout(showNext, 250);
    }, 550);
  }
  showNext();
}

function seqTap(colIdx) {
  if (seqIsShowing) return;
  seqUserInput.push(colIdx);
  seqStep++;

  var btn = document.getElementById('sb' + colIdx);
  if (btn) { btn.style.transform = 'scale(0.92)'; setTimeout(function() { if (btn) btn.style.transform = 'scale(1)'; }, 120); }

  var prog = document.getElementById('seq-prog');
  if (prog) prog.textContent = 'Tap ' + seqStep + ' of ' + seqPattern.length;

  if (seqUserInput[seqStep - 1] !== seqPattern[seqStep - 1]) {
    var instrEl = document.getElementById('seq-instr');
    if (instrEl) instrEl.textContent = '❌ Not quite — watch again!';
    var btnsEl = document.getElementById('seq-btns');
    if (btnsEl) { btnsEl.style.opacity = '0.3'; btnsEl.style.pointerEvents = 'none'; }
    taskScore = Math.max(0, taskScore - 10);
    setTimeout(function() { seqUserInput = []; seqStep = 0; setTimeout(playSequence, 600); }, 1200);
    return;
  }

  if (seqStep >= seqPattern.length) {
    taskScore += 20;
    var instrEl2 = document.getElementById('seq-instr');
    if (instrEl2) instrEl2.textContent = '✅ Correct! Great memory.';
    setTimeout(showResult, 1200);
  }
}

// ============================================================
//  TASK 3 — SPATIAL MEMORY (grid positions)
// ============================================================
function startSpatialTask() {
  if (timerInterval) clearInterval(timerInterval);
  currentTask     = 'spatial';
  spatialSelected = [];

  var cfg         = LEVEL_CONFIG[currentLevel];
  spatialGridSize = cfg.gridSize;
  var total       = spatialGridSize * spatialGridSize;
  var showCount   = Math.max(2, Math.floor(total * 0.35));

  var indices = [];
  for (var i = 0; i < total; i++) indices.push(i);
  shuffleArray(indices);
  spatialPattern = indices.slice(0, showCount);

  document.getElementById('game-view').innerHTML =
    '<p class="instruction-text" id="sp-instr">Remember which cells light up</p>' +
    '<div id="sp-grid" style="display:grid;grid-template-columns:repeat(' + spatialGridSize + ',1fr);gap:8px;max-width:320px;margin:12px auto;"></div>' +
    '<p id="sp-info" style="text-align:center;font-size:13px;color:var(--muted);margin-top:8px;">Memorise ' + showCount + ' highlighted cell' + (showCount > 1 ? 's' : '') + '</p>' +
    '<button id="sp-ready-btn" onclick="spatialStartRecall(' + showCount + ')" style="display:none;width:100%;padding:14px;background:var(--dark);color:white;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;margin-top:16px;font-family:var(--font);">I have memorised them →</button>';

  var grid = document.getElementById('sp-grid');
  for (var j = 0; j < total; j++) {
    var cell = document.createElement('div');
    cell.dataset.index = j;
    cell.style.cssText = 'aspect-ratio:1/1;border-radius:10px;border:2px solid var(--border);background:' +
      (spatialPattern.indexOf(j) !== -1 ? 'var(--accent)' : 'var(--bg)') + ';transition:background 0.3s,border-color 0.3s;';
    grid.appendChild(cell);
  }

  // Hide after 3 seconds
  setTimeout(function() {
    var cells = grid.querySelectorAll('div');
    cells.forEach(function(c) { c.style.background = 'var(--bg)'; c.style.borderColor = 'var(--border)'; });

    var instrEl = document.getElementById('sp-instr');
    if (instrEl) instrEl.textContent = 'Now tap the cells that were highlighted';
    var infoEl = document.getElementById('sp-info');
    if (infoEl) infoEl.textContent = '0 / ' + showCount + ' selected';
    var readyBtn = document.getElementById('sp-ready-btn');
    if (readyBtn) readyBtn.style.display = 'block';

    cells.forEach(function(c) {
      c.style.cursor = 'pointer';
      c.addEventListener('click', function() { spatialTap(c, showCount); });
    });
  }, 3000);
}

function spatialTap(cell, target) {
  var idx = parseInt(cell.dataset.index);
  var pos = spatialSelected.indexOf(idx);

  if (pos === -1) {
    spatialSelected.push(idx);
    cell.style.background = 'var(--blue)';
    cell.style.borderColor = '#1a5fa8';
  } else {
    spatialSelected.splice(pos, 1);
    cell.style.background = 'var(--bg)';
    cell.style.borderColor = 'var(--border)';
  }

  var infoEl = document.getElementById('sp-info');
  if (infoEl) infoEl.textContent = spatialSelected.length + ' / ' + target + ' selected';
}

function spatialStartRecall(target) {
  var correct = 0, wrong = 0;
  spatialSelected.forEach(function(idx) {
    if (spatialPattern.indexOf(idx) !== -1) correct++; else wrong++;
  });
  var missed = spatialPattern.length - correct;
  taskScore  = Math.max(0, Math.round(((correct - wrong - missed * 0.5) / spatialPattern.length) * 100));

  var cells = document.querySelectorAll('#sp-grid div');
  cells.forEach(function(c) {
    var idx = parseInt(c.dataset.index);
    var inPat = spatialPattern.indexOf(idx) !== -1;
    var inSel = spatialSelected.indexOf(idx) !== -1;
    if (inPat && inSel)  { c.style.background = '#eaf3de'; c.style.borderColor = '#639922'; }
    else if (inPat)      { c.style.background = '#fff4e0'; c.style.borderColor = '#ba7517'; }
    else if (inSel)      { c.style.background = '#fcebeb'; c.style.borderColor = 'var(--red)'; }
  });

  var instrEl = document.getElementById('sp-instr');
  if (instrEl) instrEl.textContent = correct === spatialPattern.length && wrong === 0
    ? '✅ Perfect recall!' : correct + ' correct, ' + wrong + ' wrong';

  setTimeout(showResult, 1500);
}

// ============================================================
//  RESULT
// ============================================================
function calculateScore() {
  if (currentTask === 'cards') {
    if (matchedCount === 0) return 0;
    var maxTime     = LEVEL_CONFIG[currentLevel].time;
    var timeBonus   = Math.round((secondsLeft / maxTime) * 20);
    var movePenalty = Math.max(0, (moveCount - totalPairs) * 2);
    return Math.max(0, Math.min(100, Math.round((matchedCount / totalPairs) * 80) + timeBonus - movePenalty));
  }
  return Math.min(100, Math.max(0, taskScore));
}

function showResult() {
  if (timerInterval) clearInterval(timerInterval);
  var score = calculateScore();
  var labels = { cards:'Card Matching', sequence:'Sequence Recall', spatial:'Spatial Memory' };

  document.getElementById('result-emoji').textContent = score >= 50 ? '🎉' : '⏰';
  document.getElementById('result-title').textContent = labels[currentTask] + ' Complete!';
  document.getElementById('result-sub').textContent   = currentTask === 'cards'
    ? (matchedCount === totalPairs
        ? 'All ' + totalPairs + ' pairs in ' + moveCount + ' moves · ' + getDifficultyLabel(currentLevel)
        : 'Found ' + matchedCount + ' of ' + totalPairs + ' · ' + getDifficultyLabel(currentLevel))
    : 'Score: ' + score + '/100 · ' + getDifficultyLabel(currentLevel);
  document.getElementById('result-score').textContent = score;

  updateStreak();
  saveScoreWithLevel('memory', score, currentLevel);

  var labels = { cards:'Card Matching', sequence:'Sequence Recall', spatial:'Spatial Memory' };
  showCongrats(score, labels[currentTask] || 'Memory', function() {
    document.getElementById('game-view').classList.add('hidden');
    document.getElementById('result-view').classList.add('visible');
  });

  var nextLevel  = getNextDifficultyLevel('memory');
  var msgEl      = document.getElementById('level-change-msg');
  if (msgEl) {
    if (nextLevel > currentLevel)      { msgEl.textContent = '⬆️ Great work — next session moves to ' + DIFFICULTY_LABELS[nextLevel] + '!'; msgEl.style.color = '#3b6d11'; }
    else if (nextLevel < currentLevel) { msgEl.textContent = '⬇️ Next session drops to ' + DIFFICULTY_LABELS[nextLevel] + ' to build back up.'; msgEl.style.color = '#ba7517'; }
    else                               { msgEl.textContent = '🔁 Keep going — stay on ' + DIFFICULTY_LABELS[nextLevel] + ' next session.'; msgEl.style.color = 'var(--muted)'; }
    msgEl.style.display = 'block';
  }
}

function shuffleArray(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}
