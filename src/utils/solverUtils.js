// Pure JavaScript utilities for Wordle solving

// Compute feedback pattern string (b/g/y) for a guess and actual word
export function getFeedback(guess, actual) {
  let feedback = Array(5).fill('b');
  const target = actual.split('');
  // first pass: greens
  for (let i = 0; i < 5; i++) {
    if (guess[i] === target[i]) {
      feedback[i] = 'g';
      target[i] = null;
    }
  }
  // second pass: yellows
  for (let i = 0; i < 5; i++) {
    if (feedback[i] === 'b') {
      const idx = target.indexOf(guess[i]);
      if (idx >= 0) {
        feedback[i] = 'y';
        target[idx] = null;
      }
    }
  }
  return feedback.join('');
}

// Filter possible words by constraints
export function filterWords(possible, greens, yellows, grays) {
  return possible.filter(word => {
    // check greens
    for (let i = 0; i < 5; i++) {
      if (greens[i] && word[i] !== greens[i]) return false;
    }
    // check yellows and grays
    for (let i = 0; i < 5; i++) {
      const ch = word[i];
      // yellow: letter can't be in that position
      if (yellows[i] && yellows[i].includes(ch)) return false;
      // gray: letter can't appear unless it's in yellows elsewhere
      if (grays.includes(ch)) {
        const required = yellows.some(arr => arr.includes(ch));
        if (!required) return false;
      }
    }
    // ensure all yellow letters appear somewhere
    for (let i = 0; i < 5; i++) {
      const arr = yellows[i];
      if (arr) {
        for (const y of arr) {
          if (!word.includes(y)) return false;
        }
      }
    }
    return true;
  });
}

// Calculate information gain for a guess
function calculateInfoGain(guess, possible) {
  const total = possible.length;
  const counts = {};
  for (const actual of possible) {
    const pattern = getFeedback(guess, actual);
    counts[pattern] = (counts[pattern] || 0) + 1;
  }
  let info = 0;
  for (const cnt of Object.values(counts)) {
    const p = cnt / total;
    info += p * Math.log2(1 / p);
  }
  return info;
}

// Fisher-Yates shuffle
function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Find best guess, sampling if necessary
export function findBestGuess(possible, isFirst = false, sampleSize = possible.length) {
  if (isFirst) return 'tares';
  const candidates = possible.length <= sampleSize
    ? possible
    : shuffle(possible).slice(0, sampleSize);
  let best = null;
  let bestScore = -Infinity;
  for (const guess of candidates) {
    const score = calculateInfoGain(guess, possible);
    if (score > bestScore) {
      bestScore = score;
      best = guess;
    }
  }
  return best;
}
