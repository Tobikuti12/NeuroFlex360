// =========================================
//  congrats.js – Colourful celebration overlay
//  NeuroFlex360 | Middlesex University Dubai
//
//  Call: showCongrats(score, moduleName, onDone)
//  Shows for ~3 seconds then calls onDone()
// =========================================

function showCongrats(score, moduleName, onDone) {
  // Build messages based on score
  var messages = {
    high: [
      'Brilliant work! 🌟', 'Outstanding! 🏆', 'You are on fire! 🔥',
      'Incredible effort! 🎉', 'Keep it up! 💪', 'Amazing! 🌈'
    ],
    mid: [
      'Well done! 👍', 'Good effort! 😊', 'You are improving! 📈',
      'Nice work! ⭐', 'Keep going! 🚀', 'Every session counts! 💙'
    ],
    low: [
      'You showed up — that matters! 💚', 'Keep practising! 🌱',
      'Every session makes you stronger! 💛', 'You did it! ✅',
      'Progress takes time — you are doing great! 🌸'
    ]
  };

  var bucket  = score >= 75 ? 'high' : score >= 50 ? 'mid' : 'low';
  var list    = messages[bucket];
  var message = list[Math.floor(Math.random() * list.length)];

  var colours = ['#4ecca3','#378add','#ba7517','#a32d2d','#9c6dc9','#e05f8c'];
  var emojis  = score >= 75
    ? ['🎉','🌟','🏆','🎊','⭐','🌈','🥳','🎈','💫','✨']
    : ['👍','💪','🌱','💚','😊','🙌','⭐','💙','🌸','✅'];

  // Create overlay
  var overlay = document.createElement('div');
  overlay.id  = 'congrats-overlay';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:9999',
    'display:flex', 'flex-direction:column',
    'align-items:center', 'justify-content:center',
    'background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)',
    'overflow:hidden', 'animation:congratsFade 0.4s ease'
  ].join(';');

  // Floating emoji confetti
  var confettiHTML = '';
  for (var i = 0; i < 20; i++) {
    var emoji   = emojis[Math.floor(Math.random() * emojis.length)];
    var left    = Math.random() * 100;
    var delay   = Math.random() * 2;
    var size    = 20 + Math.random() * 24;
    var dur     = 2 + Math.random() * 2;
    confettiHTML += '<div style="position:absolute;left:' + left + '%;top:-40px;font-size:' + size + 'px;animation:floatDown ' + dur + 's ' + delay + 's ease-in forwards;opacity:0.9;">' + emoji + '</div>';
  }

  // Score ring colour
  var ringColour = score >= 75 ? '#4ecca3' : score >= 50 ? '#ba7517' : '#378add';

  overlay.innerHTML = confettiHTML +
    '<style>' +
    '@keyframes congratsFade { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }' +
    '@keyframes floatDown { 0%{transform:translateY(0) rotate(0deg);opacity:0.9} 100%{transform:translateY(110vh) rotate(360deg);opacity:0} }' +
    '@keyframes popIn { 0%{transform:scale(0)} 70%{transform:scale(1.15)} 100%{transform:scale(1)} }' +
    '@keyframes pulseRing { 0%,100%{box-shadow:0 0 0 0 rgba(78,204,163,0.4)} 50%{box-shadow:0 0 0 20px rgba(78,204,163,0)} }' +
    '</style>' +
    '<div style="text-align:center;padding:32px 24px;position:relative;z-index:2;">' +
      '<div style="width:120px;height:120px;border-radius:50%;border:6px solid ' + ringColour + ';display:flex;align-items:center;justify-content:center;margin:0 auto 20px;animation:popIn 0.5s 0.2s ease both,pulseRing 2s 0.7s ease infinite;background:rgba(255,255,255,0.05);">' +
        '<div style="font-size:36px;font-weight:700;color:white;">' + score + '</div>' +
      '</div>' +
      '<div style="font-size:28px;font-weight:700;color:white;margin-bottom:8px;line-height:1.2;">' + message + '</div>' +
      '<div style="font-size:14px;color:rgba(255,255,255,0.6);margin-bottom:28px;">' + moduleName + ' complete</div>' +
      '<div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;">' +
        colours.map(function(c) {
          return '<div style="width:14px;height:14px;border-radius:50%;background:' + c + ';animation:popIn 0.4s ' + (Math.random() * 0.5) + 's ease both;"></div>';
        }).join('') +
      '</div>' +
    '</div>';

  document.body.appendChild(overlay);

  // Auto-dismiss after 2.8 seconds
  setTimeout(function() {
    overlay.style.transition = 'opacity 0.4s ease';
    overlay.style.opacity    = '0';
    setTimeout(function() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (typeof onDone === 'function') onDone();
    }, 400);
  }, 2800);

  // Also dismiss on tap
  overlay.addEventListener('click', function() {
    overlay.style.opacity = '0';
    setTimeout(function() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (typeof onDone === 'function') onDone();
    }, 300);
  });
}
