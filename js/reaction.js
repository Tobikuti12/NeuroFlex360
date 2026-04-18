// =========================================
//  reaction.js – Reaction Time Module (Adaptive)
//  NeuroFlex360 | NeuroFlex360
//
//  L1 Easy   – 5 rounds, delay 2000–4000ms
//  L2 Medium – 6 rounds, delay 1500–3500ms
//  L3 Hard   – 7 rounds, delay 1000–2500ms
// =========================================

var RT_CONFIG = {
  1: { rounds: 5, minDelay: 2000, maxDelay: 4000 },
  2: { rounds: 6, minDelay: 1500, maxDelay: 3500 },
  3: { rounds: 7, minDelay: 1000, maxDelay: 2500 }
};

var gameState    = 'idle';
var startTime    = 0;
var roundTimes   = [];
var roundsPlayed = 0;
var waitTimeout  = null;
var currentLevel = 1;
var totalRounds  = 5;

var circleEl = document.getElementById('rt-circle');
var labelEl  = document.getElementById('rt-circle-label');
var barsEl   = document.getElementById('rt-bars');
var resultEl = document.getElementById('rt-result-display');
var msEl     = document.getElementById('rt-ms');
var instrEl  = document.getElementById('rt-instruction');

function handleTap() {
  if      (gameState === 'idle' || gameState === 'done') startWaiting();
  else if (gameState === 'waiting') tooEarly();
  else if (gameState === 'ready')   recordReaction();
}

function startWaiting() {
  gameState = 'waiting';
  setCircleState('waiting', 'WAIT...');
  instrEl.textContent = 'Wait for green — tap as fast as you can!';
  resultEl.classList.add('hidden');

  var cfg   = RT_CONFIG[currentLevel];
  var delay = cfg.minDelay + Math.random() * (cfg.maxDelay - cfg.minDelay);

  waitTimeout = setTimeout(function() {
    gameState = 'ready';
    startTime = Date.now();
    setCircleState('ready', 'TAP NOW!');
    instrEl.textContent = 'TAP IT!';
  }, delay);
}

function tooEarly() {
  clearTimeout(waitTimeout);
  gameState = 'idle';
  setCircleState('too-early', 'TOO\nEARLY!');
  instrEl.textContent = 'Too early — try again!';
  setTimeout(function() { setCircleState('idle', 'TAP TO\nTRY AGAIN'); }, 1500);
}

function recordReaction() {
  var reactionTime = Date.now() - startTime;
  roundTimes.push(reactionTime);
  roundsPlayed++;

  msEl.textContent = reactionTime;
  resultEl.classList.remove('hidden');
  addBarToChart(reactionTime);
  updateStats();

  if (roundsPlayed >= totalRounds) {
    gameState = 'done';
    setCircleState('idle', 'DONE!');
    instrEl.textContent = 'All rounds complete!';
    setTimeout(showResult, 1200);
  } else {
    gameState = 'idle';
    setCircleState('idle', 'ROUND ' + (roundsPlayed + 1) + '\nTAP TO GO');
    instrEl.textContent = 'Round ' + roundsPlayed + ' done — tap to continue.';
  }
}

function setCircleState(state, text) {
  circleEl.className = 'rt-circle ' + state;
  labelEl.innerHTML  = text.replace('\n', '<br>');
}

function addBarToChart(time) {
  var bar = document.createElement('div');
  bar.classList.add('rt-bar');
  bar.dataset.time     = time;
  var height           = Math.max(10, Math.min(60, Math.round(60 - (time - 150) / 12)));
  bar.style.height     = height + 'px';
  bar.style.background = time < 300 ? '#639922' : time < 500 ? '#BA7517' : '#a32d2d';
  barsEl.appendChild(bar);
}

function updateStats() {
  document.getElementById('stat-rounds').textContent = roundsPlayed + ' / ' + totalRounds;
  if (roundTimes.length > 0) {
    document.getElementById('stat-best').textContent =
      Math.min.apply(null, roundTimes);
    document.getElementById('stat-avg').textContent  =
      Math.round(roundTimes.reduce(function(a, b) { return a + b; }, 0) / roundTimes.length);
  }
}

function showResult() {
  var avg  = Math.round(roundTimes.reduce(function(a, b) { return a + b; }, 0) / roundTimes.length);
  var best = Math.min.apply(null, roundTimes);

  var grade;
  if      (avg < 250) grade = 'Exceptional reflexes! 🏆';
  else if (avg < 350) grade = 'Great reaction speed! 💪';
  else if (avg < 500) grade = 'Good — keep practising! 👍';
  else                grade = 'Keep training to improve ⚡';

  document.getElementById('result-sub').textContent       = grade + ' · ' + getDifficultyLabel(currentLevel);
  document.getElementById('result-score').textContent     = avg + 'ms';
  document.getElementById('result-score-lbl').textContent =
    'Average over ' + totalRounds + ' rounds (best: ' + best + 'ms)';

  var normalised = Math.max(0, Math.min(100, Math.round((800 - avg) / 6.5)));
  updateStreak();
  saveScoreWithLevel('reaction', normalised, currentLevel);

  showCongrats(normalised, 'Reaction Time', function() {
    document.getElementById('game-view').classList.add('hidden');
    document.getElementById('result-view').classList.add('visible');
  });

  var nextLevel  = getNextDifficultyLevel('reaction');
  var levelMsgEl = document.getElementById('level-change-msg');
  if (levelMsgEl) {
    if (nextLevel > currentLevel) {
      levelMsgEl.textContent = '⬆️ Fast reflexes — next session moves to ' + DIFFICULTY_LABELS[nextLevel] + '!';
      levelMsgEl.style.color = '#3b6d11';
      levelMsgEl.style.display = 'block';
    } else if (nextLevel < currentLevel) {
      levelMsgEl.textContent = '⬇️ Next session drops to ' + DIFFICULTY_LABELS[nextLevel] + ' to keep it manageable.';
      levelMsgEl.style.color = '#ba7517';
      levelMsgEl.style.display = 'block';
    } else {
      levelMsgEl.textContent = '🔁 Staying on ' + DIFFICULTY_LABELS[nextLevel] + ' — keep training!';
      levelMsgEl.style.color = 'var(--muted)';
      levelMsgEl.style.display = 'block';
    }
  }
}

window.addEventListener('DOMContentLoaded', function() {
  currentLevel = getDifficultyLevel('reaction');
  totalRounds  = RT_CONFIG[currentLevel].rounds;

  var badge = document.getElementById('difficulty-badge');
  if (badge) {
    badge.textContent = getDifficultyLabel(currentLevel);
    badge.style.color = DIFFICULTY_COLOURS[currentLevel];
  }

  document.getElementById('stat-rounds').textContent = '0 / ' + totalRounds;
  setCircleState('idle', 'TAP TO\nSTART');
});
