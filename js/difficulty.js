// =========================================
//  difficulty.js – Adaptive Difficulty Engine
//  NeuroFlex360 | NeuroFlex360
//
//  Reads the last 3 session scores for a module
//  and automatically determines the next level.
//
//  Scale UP:   last 3 scores all >= 75
//  Scale DOWN: last 3 scores all < 50
//  Hold:       anything in between
// =========================================

const DIFFICULTY_LABELS  = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };
const DIFFICULTY_COLOURS = { 1: '#3b6d11', 2: '#ba7517', 3: '#a32d2d' };

function getDifficultyLevel(module) {
  const data    = JSON.parse(localStorage.getItem('nf360_scores') || '{}');
  const entries = data[module] || [];

  if (entries.length < 3) return 1;

  const recent    = entries.slice(-3).map(function(e) { return e.score; });
  const lastLevel = entries[entries.length - 1].level || 1;

  if (recent.every(function(s) { return s >= 75; }) && lastLevel < 3) return lastLevel + 1;
  if (recent.every(function(s) { return s <  50; }) && lastLevel > 1) return lastLevel - 1;
  return lastLevel;
}

function saveScoreWithLevel(module, score, level) {
  const data = JSON.parse(localStorage.getItem('nf360_scores') || '{}');
  if (!data[module]) data[module] = [];

  data[module].push({
    score: score,
    level: level,
    date:  new Date().toISOString()
  });

  if (data[module].length > 10) data[module] = data[module].slice(-10);
  localStorage.setItem('nf360_scores', JSON.stringify(data));
}

function getDifficultyLabel(level) {
  return 'Level ' + level + ' · ' + DIFFICULTY_LABELS[level];
}
