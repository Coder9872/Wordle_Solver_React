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
        // allow gray letters if they are already confirmed as greens (duplicate letter handling)
        const required = yellows.some(arr => arr.includes(ch)) || greens.includes(ch);
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


// Fisher-Yates shuffle
function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Calculate information gain for a guess
function calculateInfoGain(partitions, total) {
  let info = 0;
  for (const count of Object.values(partitions)) {
    const p = count / total;
    if (p > 0) {
      info += p * Math.log2(1 / p);
    }
  }
  return info;
}

// Find best guess by minimizing the size of the largest remaining word list.
export function findBestGuess(possible, isFirst = false) {
  if (isFirst) {
    // For the first guess, return a pre-calculated best word and an empty list for top 5.
    return { best: "salet", top: [] };
  }

  if (possible.length === 1) {
    const best = possible[0] || '';
    return { best, top: [{ guess: best, worstCase: 1, entropy: 0 }] };
  }
  if (possible.length === 2) {
    // for two candidates, show both and pick the alphabetically later word first
    const sorted = possible.slice().sort();
    const top = sorted.map(g => ({ guess: g, worstCase: 1, entropy: 0 }));
    const best = sorted[1] || sorted[0];
    return { best, top };
  }

  const guessScores = [];
  const total = possible.length;

  // Iterate through all possible words to find the one that minimizes the worst-case scenario.
  for (const guess of possible) {
    const partitions = {};
    for (const answer of possible) {
      const feedback = getFeedback(guess, answer);
      if (!partitions[feedback]) {
        partitions[feedback] = 0;
      }
      partitions[feedback]++;
    }

    const worstCaseSize = Math.max(...Object.values(partitions));
    const entropy = calculateInfoGain(partitions, total);
    guessScores.push({ guess, worstCase: worstCaseSize, entropy });
  }

  // Sort primarily by worst-case size (ascending), then by entropy (descending) as a tie-breaker.
  guessScores.sort((a, b) => {
    if (a.entropy !== b.entropy) {
      return -1*a.entropy + b.entropy;
    }
    return b.worstCase - a.worstCase;
  });

  const top15 = guessScores.slice(0, 15);
  const bestGuess = top15[0]?.guess || possible[0];

  return { best: bestGuess, top: top15 };
}
