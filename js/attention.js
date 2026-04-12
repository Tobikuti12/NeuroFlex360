// =========================================
//  attention.js – Attention Module (Adaptive)
//  NeuroFlex360 | Middlesex University Dubai
//
//  Three task types:
//  1. Number Focus     – pick correct number (all levels)
//  2. Target Detection – tap only when target appears (L2+)
//  3. Selective Filter – tap target, ignore distractors (L3)
//
//  L1 Easy   – number focus only, 2-digit, 8 questions
//  L2 Medium – number focus + target detection, 10 questions
//  L3 Hard   – all three, 3-digit + div5, 12 questions
// =========================================

var QUESTION_TYPES_BY_LEVEL = {
  1: ['largest', 'smallest', 'even', 'odd'],
  2: ['largest', 'smallest', 'even', 'odd'],
  3: ['largest', 'smallest', 'even', 'odd', 'div5']
};
var QUESTIONS_BY_LEVEL = { 1: 8, 2: 10, 3: 12 };
var POINTS_PER_CORRECT = 10;

var currentQuestion = 0, score = 0, streak = 0;
var isAnswered = false, currentLevel = 1, totalQuestions = 8;
var currentTask = 'numbers';

// Target detection state
var tdTarget    = '';
var tdScore     = 0;
var tdRound     = 0;
var tdTotal     = 10;
var tdTimeout   = null;

// Selective filter state
var sfScore  = 0;
var sfRound  = 0;
var sfTotal  = 10;

// ---- INIT ----
window.addEventListener('DOMContentLoaded', function() {
  currentLevel   = getDifficultyLevel('attention');
  totalQuestions = QUESTIONS_BY_LEVEL[currentLevel];

  var badge = document.getElementById('difficulty-badge');
  if (badge) {
    badge.textContent = getDifficultyLabel(currentLevel);
    badge.style.color = DIFFICULTY_COLOURS[currentLevel];
  }

  if (currentLevel === 1) {
    startNumberTask();
  } else {
    showTaskSelector();
  }
});

// ---- TASK SELECTOR ----
function showTaskSelector() {
  var tasks = ['numbers'];
  if (currentLevel >= 2) tasks.push('target');
  if (currentLevel >= 3) tasks.push('filter');

  var info = {
    numbers: { icon:'🔢', label:'Number Focus',       desc:'Pick the correct number from the set' },
    target:  { icon:'🎯', label:'Target Detection',   desc:'Tap only when you see the target symbol' },
    filter:  { icon:'🚦', label:'Selective Filtering', desc:'Tap the correct colour — ignore the rest' }
  };

  var html = '<div style="padding:8px 0;">' +
    '<p style="font-size:14px;color:var(--muted);text-align:center;margin-bottom:16px;">Choose an attention task:</p>';

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
  if (task === 'numbers') startNumberTask();
  if (task === 'target')  startTargetTask();
  if (task === 'filter')  startFilterTask();
}

// ============================================================
//  TASK 1 — NUMBER FOCUS
// ============================================================
function startNumberTask() {
  currentTask    = 'numbers';
  currentQuestion = 0; score = 0; streak = 0;
  isAnswered     = false;
  totalQuestions = QUESTIONS_BY_LEVEL[currentLevel];

  // Restore stat boxes
  var statQ = document.getElementById('stat-question');
  if (statQ) statQ.textContent = '1 / ' + totalQuestions;
  updateStats();

  // Rebuild game area for number task
  document.getElementById('game-view').innerHTML =
    '<div class="question-box">' +
      '<p class="question-type" id="question-type">Which number is the largest?</p>' +
      '<div class="number-display" id="number-display">--</div>' +
      '<p class="question-hint" id="question-hint">Tap the correct number below</p>' +
    '</div>' +
    '<div class="choices-grid" id="choices-grid"></div>' +
    '<div class="feedback-msg hidden" id="feedback-msg"></div>';

  loadNextQuestion();
}

function loadNextQuestion() {
  if (currentQuestion >= totalQuestions) { showResult(); return; }
  isAnswered = false;

  var feedbackEl = document.getElementById('feedback-msg');
  if (feedbackEl) { feedbackEl.classList.add('hidden'); feedbackEl.className = 'feedback-msg hidden'; }

  var types = QUESTION_TYPES_BY_LEVEL[currentLevel];
  var type  = types[Math.floor(Math.random() * types.length)];
  var numbers = generateNumbers(type, currentLevel);
  var correct = getCorrectAnswer(type, numbers);

  var qtEl = document.getElementById('question-type');
  var ndEl = document.getElementById('number-display');
  var qhEl = document.getElementById('question-hint');
  var sqEl = document.getElementById('stat-question');
  if (qtEl) qtEl.textContent = getQuestionText(type);
  if (ndEl) ndEl.textContent = numbers.join('   ·   ');
  if (qhEl) qhEl.textContent = 'Tap the correct number below';
  if (sqEl) sqEl.textContent = (currentQuestion + 1) + ' / ' + totalQuestions;

  renderChoices(numbers, correct);
}

function randomNDigit(digits) {
  var min = Math.pow(10, digits - 1);
  var max = Math.pow(10, digits) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateNumbers(type, level) {
  var digits  = level === 3 ? 3 : (level === 2 && Math.random() > 0.5 ? 3 : 2);
  var numbers = [];
  if (type === 'even') {
    var even; do { even = randomNDigit(digits); } while (even % 2 !== 0);
    numbers.push(even);
    while (numbers.length < 4) { var odd; do { odd = randomNDigit(digits); } while (odd % 2 === 0 || numbers.includes(odd)); numbers.push(odd); }
  } else if (type === 'odd') {
    var odd2; do { odd2 = randomNDigit(digits); } while (odd2 % 2 === 0);
    numbers.push(odd2);
    while (numbers.length < 4) { var even2; do { even2 = randomNDigit(digits); } while (even2 % 2 !== 0 || numbers.includes(even2)); numbers.push(even2); }
  } else if (type === 'div5') {
    var d5; do { d5 = randomNDigit(digits); } while (d5 % 5 !== 0);
    numbers.push(d5);
    while (numbers.length < 4) { var n; do { n = randomNDigit(digits); } while (n % 5 === 0 || numbers.includes(n)); numbers.push(n); }
  } else {
    while (numbers.length < 4) { var m = randomNDigit(digits); if (!numbers.includes(m)) numbers.push(m); }
  }
  return numbers;
}

function getCorrectAnswer(type, numbers) {
  if (type === 'largest')  return Math.max.apply(null, numbers);
  if (type === 'smallest') return Math.min.apply(null, numbers);
  if (type === 'even')     return numbers.find(function(n) { return n % 2 === 0; });
  if (type === 'odd')      return numbers.find(function(n) { return n % 2 !== 0; });
  if (type === 'div5')     return numbers.find(function(n) { return n % 5 === 0; });
  return numbers[0];
}

function getQuestionText(type) {
  return { largest:'Which number is the LARGEST?', smallest:'Which number is the SMALLEST?',
           even:'Which number is EVEN?', odd:'Which number is ODD?',
           div5:'Which number is divisible by 5?' }[type];
}

function renderChoices(numbers, correctAnswer) {
  var grid = document.getElementById('choices-grid');
  if (!grid) return;
  grid.innerHTML = '';
  numbers.slice().sort(function() { return Math.random() - 0.5; }).forEach(function(number) {
    var btn = document.createElement('button');
    btn.classList.add('choice-btn');
    btn.textContent = number;
    btn.addEventListener('click', function() { handleAnswer(btn, number, correctAnswer); });
    grid.appendChild(btn);
  });
}

function handleAnswer(clickedBtn, chosen, correct) {
  if (isAnswered) return;
  isAnswered = true;
  document.querySelectorAll('.choice-btn').forEach(function(b) { b.disabled = true; });
  var feedbackEl = document.getElementById('feedback-msg');
  if (chosen === correct) {
    clickedBtn.classList.add('correct');
    score += POINTS_PER_CORRECT; streak++;
    if (feedbackEl) { feedbackEl.textContent = streak >= 3 ? '✅ Correct! ' + streak + ' in a row!' : '✅ Correct!'; feedbackEl.className = 'feedback-msg correct-msg'; }
  } else {
    clickedBtn.classList.add('wrong'); streak = 0;
    document.querySelectorAll('.choice-btn').forEach(function(b) { if (parseInt(b.textContent) === correct) b.classList.add('correct'); });
    if (feedbackEl) { feedbackEl.textContent = '❌ Wrong — the correct answer was ' + correct; feedbackEl.className = 'feedback-msg wrong-msg'; }
  }
  if (feedbackEl) feedbackEl.classList.remove('hidden');
  updateStats();
  currentQuestion++;
  setTimeout(loadNextQuestion, 1100);
}

function updateStats() {
  var ss = document.getElementById('stat-score');
  var sk = document.getElementById('stat-streak');
  if (ss) ss.textContent = score;
  if (sk) sk.textContent = streak;
}

// ============================================================
//  TASK 2 — TARGET DETECTION (continuous vigilance)
// ============================================================
var TD_SYMBOLS = ['★', '●', '▲', '■', '♦', '✿'];

function startTargetTask() {
  currentTask = 'target';
  tdScore = 0; tdRound = 0; tdTotal = 12;
  tdTarget = TD_SYMBOLS[Math.floor(Math.random() * TD_SYMBOLS.length)];

  document.getElementById('game-view').innerHTML =
    '<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px;text-align:center;margin-bottom:16px;box-shadow:var(--shadow);">' +
      '<p style="font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px;">Your target symbol</p>' +
      '<div style="font-size:52px;font-weight:600;color:var(--text);margin-bottom:8px;" id="td-target-display">' + tdTarget + '</div>' +
      '<p style="font-size:12px;color:var(--muted);">Tap <strong style="color:var(--text);">YES</strong> when you see this. Tap <strong style="color:var(--text);">NO</strong> for anything else.</p>' +
    '</div>' +
    '<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:32px 20px;text-align:center;margin-bottom:16px;box-shadow:var(--shadow);">' +
      '<div id="td-symbol" style="font-size:72px;min-height:80px;transition:opacity 0.15s;"></div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
      '<button onclick="tdAnswer(true)" style="padding:18px;background:#eaf3de;border:2px solid #639922;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;color:#3b6d11;">✅ YES — it\'s the target</button>' +
      '<button onclick="tdAnswer(false)" style="padding:18px;background:#fcebeb;border:2px solid var(--red);border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;color:var(--red);">❌ NO — different symbol</button>' +
    '</div>' +
    '<p id="td-feedback" style="text-align:center;font-size:13px;font-weight:500;margin-top:12px;min-height:20px;"></p>' +
    '<p id="td-prog" style="text-align:center;font-size:12px;color:var(--muted);margin-top:6px;">Round 0 / ' + tdTotal + '</p>';

  setTimeout(showNextTdSymbol, 600);
}

function showNextTdSymbol() {
  if (tdRound >= tdTotal) { showResult(); return; }
  var symbolEl = document.getElementById('td-symbol');
  if (!symbolEl) return;

  // 40% chance of showing the target, 60% distractor
  var showTarget = Math.random() < 0.4;
  var sym;
  if (showTarget) {
    sym = tdTarget;
  } else {
    var distractors = TD_SYMBOLS.filter(function(s) { return s !== tdTarget; });
    sym = distractors[Math.floor(Math.random() * distractors.length)];
  }

  symbolEl.dataset.isTarget = showTarget ? 'true' : 'false';
  symbolEl.textContent = sym;
  symbolEl.style.opacity = '1';
}

function tdAnswer(userSaysYes) {
  var symbolEl = document.getElementById('td-symbol');
  if (!symbolEl || !symbolEl.dataset.isTarget) return;

  var isTarget  = symbolEl.dataset.isTarget === 'true';
  var correct   = (userSaysYes === isTarget);
  var feedbackEl = document.getElementById('td-feedback');

  if (correct) {
    tdScore++;
    if (feedbackEl) { feedbackEl.textContent = '✅ Correct!'; feedbackEl.style.color = '#3b6d11'; }
  } else {
    if (feedbackEl) {
      feedbackEl.textContent = isTarget ? '❌ That was the target — you should have tapped YES' : '❌ That was not the target — you should have tapped NO';
      feedbackEl.style.color = 'var(--red)';
    }
  }

  tdRound++;
  var prog = document.getElementById('td-prog');
  if (prog) prog.textContent = 'Round ' + tdRound + ' / ' + tdTotal;

  symbolEl.style.opacity = '0';
  setTimeout(showNextTdSymbol, 500);
}

// ============================================================
//  TASK 3 — SELECTIVE FILTERING (tap correct colour)
// ============================================================
var SF_COLOURS = [
  { name:'Blue',   hex:'#378add' },
  { name:'Green',  hex:'#4ecca3' },
  { name:'Red',    hex:'#a32d2d' },
  { name:'Amber',  hex:'#ba7517' }
];

function startFilterTask() {
  currentTask = 'filter';
  sfScore = 0; sfRound = 0; sfTotal = 10;

  var targetColour = SF_COLOURS[Math.floor(Math.random() * SF_COLOURS.length)];

  document.getElementById('game-view').innerHTML =
    '<div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px 20px;text-align:center;margin-bottom:16px;box-shadow:var(--shadow);">' +
      '<p style="font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px;">Tap only the</p>' +
      '<div style="display:inline-flex;align-items:center;gap:10px;background:' + targetColour.hex + '22;border:2px solid ' + targetColour.hex + ';border-radius:10px;padding:8px 20px;">' +
        '<div style="width:24px;height:24px;border-radius:50%;background:' + targetColour.hex + ';"></div>' +
        '<span style="font-size:18px;font-weight:600;color:' + targetColour.hex + ';">' + targetColour.name + '</span>' +
      '</div>' +
      '<p style="font-size:12px;color:var(--muted);margin-top:10px;">Ignore all other colours</p>' +
    '</div>' +
    '<div id="sf-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;"></div>' +
    '<p id="sf-feedback" style="text-align:center;font-size:13px;font-weight:500;min-height:20px;"></p>' +
    '<p id="sf-prog" style="text-align:center;font-size:12px;color:var(--muted);margin-top:4px;">Round 0 / ' + sfTotal + '</p>';

  renderFilterGrid(targetColour);
}

function renderFilterGrid(targetColour) {
  var grid = document.getElementById('sf-grid');
  if (!grid) return;
  grid.innerHTML = '';

  // 6 circles: 1–2 are target, rest are distractors
  var count      = 6;
  var targetCount = Math.floor(Math.random() * 2) + 1;
  var items      = [];

  for (var i = 0; i < targetCount; i++) items.push({ colour: targetColour, isTarget: true });
  while (items.length < count) {
    var distractor = SF_COLOURS.filter(function(c) { return c.name !== targetColour.name; });
    var pick       = distractor[Math.floor(Math.random() * distractor.length)];
    items.push({ colour: pick, isTarget: false });
  }

  // Shuffle
  items.sort(function() { return Math.random() - 0.5; });

  items.forEach(function(item) {
    var circle = document.createElement('div');
    circle.style.cssText = 'aspect-ratio:1/1;border-radius:50%;background:' + item.colour.hex + ';cursor:pointer;border:3px solid transparent;transition:transform 0.1s,border-color 0.15s;display:flex;align-items:center;justify-content:center;';
    circle.dataset.isTarget = item.isTarget ? 'true' : 'false';
    circle.addEventListener('click', function() { sfTap(circle, targetColour); });
    grid.appendChild(circle);
  });
}

function sfTap(circle, targetColour) {
  var isTarget = circle.dataset.isTarget === 'true';
  var feedbackEl = document.getElementById('sf-feedback');

  circle.style.transform = 'scale(0.9)';
  setTimeout(function() { if (circle) circle.style.transform = 'scale(1)'; }, 150);

  if (isTarget) {
    sfScore++;
    circle.style.borderColor = 'white';
    if (feedbackEl) { feedbackEl.textContent = '✅ Correct — that is ' + targetColour.name + '!'; feedbackEl.style.color = '#3b6d11'; }
    sfRound++;
    var prog = document.getElementById('sf-prog');
    if (prog) prog.textContent = 'Round ' + sfRound + ' / ' + sfTotal;
    if (sfRound >= sfTotal) { setTimeout(showResult, 800); return; }
    setTimeout(function() { renderFilterGrid(targetColour); if (feedbackEl) feedbackEl.textContent = ''; }, 700);
  } else {
    if (feedbackEl) { feedbackEl.textContent = '❌ That is not ' + targetColour.name + ' — ignore it!'; feedbackEl.style.color = 'var(--red)'; }
    circle.style.opacity = '0.3';
    circle.style.pointerEvents = 'none';
  }
}

// ============================================================
//  RESULT
// ============================================================
function showResult() {
  var maxScore = totalQuestions * POINTS_PER_CORRECT;
  var pct;
  if (currentTask === 'numbers') {
    pct = Math.round((score / maxScore) * 100);
  } else if (currentTask === 'target') {
    pct = Math.round((tdScore / tdTotal) * 100);
  } else {
    pct = Math.round((sfScore / sfTotal) * 100);
  }

  var labels = { numbers:'Number Focus', target:'Target Detection', filter:'Selective Filtering' };

  document.getElementById('result-sub').textContent =
    labels[currentTask] + ' · ' + getDifficultyLabel(currentLevel);
  document.getElementById('result-score').textContent = pct;

  updateStreak();
  saveScoreWithLevel('attention', pct, currentLevel);

  showCongrats(pct, labels[currentTask] || 'Attention', function() {
    document.getElementById('game-view').classList.add('hidden');
    document.getElementById('result-view').classList.add('visible');
  });

  var nextLevel = getNextDifficultyLevel('attention');
  var msgEl     = document.getElementById('level-change-msg');
  if (msgEl) {
    if (nextLevel > currentLevel)      { msgEl.textContent = '⬆️ Great work — next session moves to ' + DIFFICULTY_LABELS[nextLevel] + '!'; msgEl.style.color = '#3b6d11'; }
    else if (nextLevel < currentLevel) { msgEl.textContent = '⬇️ Next session drops to ' + DIFFICULTY_LABELS[nextLevel] + ' to build back up.'; msgEl.style.color = '#ba7517'; }
    else                               { msgEl.textContent = '🔁 Keep going — stay on ' + DIFFICULTY_LABELS[nextLevel] + ' next session.'; msgEl.style.color = 'var(--muted)'; }
    msgEl.style.display = 'block';
  }
}
