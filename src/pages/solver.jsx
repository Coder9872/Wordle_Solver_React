import React, { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import Grid from "../comps/grid.jsx";
import { Loader2, PartyPopper } from "lucide-react";
import { getFeedback, findBestGuess } from "../utils/solverUtils";

const colorMap = {
  green: "bg-[#538d4f]",
  gray: "bg-[#3a393c]",
  yellow: "bg-[#b4a03b]",
  black: "bg-black",
  default: "bg-[#121212]",
};
let grays = [];
let greens = Array(5).fill(null);
let yellows = Array(5)
  .fill()
  .map(() => []);
function updateFeedback(guess, feedback) {
  for (let i = 0; i < 5; i++) {
    if (feedback[i] === "g") {
      greens[i] = guess[i];
    } else if (feedback[i] === "y") {
      if (!yellows[i].includes(guess[i])) {
        yellows[i].push(guess[i]);
      }
    } else if (feedback[i] === "b") {
      if (!grays.includes(guess[i])) {
        grays.push(guess[i]);
      }
    }
  }
}

// default empty grid
const emptyLetters = Array.from({ length: 6 }, () => Array(5).fill(""));
const emptyColors = Array.from({ length: 6 }, () => Array(5).fill("default"));
function Solver() {
  const [words, setWords] = useState([]);
  const [likely, setLikely] = useState([]);
  // candidate list state
  const [pos, setPos] = useState([]);
  // current row index for guesses
  const [row, setRow] = useState(0);
  // state for the user input
  const [userGuess, setUserGuess] = useState(""); // actual word guessed
  const [feedback, setFeedback] = useState(""); // bgy pattern
  // error message for invalid guess
  const [error, setError] = useState("");
  // grid letters and colors in state
  const [lettersArr, setLettersArr] = useState(emptyLetters);
  const [colorsArr, setColorsArr] = useState(emptyColors);
  // next proposed guess and loading state
  const [nextGuess, setNextGuess] = useState("salet");
  const [topGuesses, setTopGuesses] = useState([
    { guess: "salet", entropy: 6.42, worstCase: 372 },
  ]);
  const [loading, setLoading] = useState(false);
  const computeTimer = useRef(null);
  const [won, setWon] = useState(false);
  const [impossible, setImpossible] = useState(false);
  // reset game
  const startNewGame = useCallback(() => {
    grays = [];
    greens = Array(5).fill(null);
    yellows = Array(5)
      .fill()
      .map(() => []);
    setPos(words);
    setRow(0);
    setLettersArr(emptyLetters);
    setColorsArr(emptyColors);
    setNextGuess("salet");
    setTopGuesses([{ guess: "salet", entropy: 6.42, worstCase: 372 }]);
    setWon(false);
    setImpossible(false);
    setError("");
    setUserGuess("");
    setFeedback("");
  }, [words]);
  // initialize on load
  useEffect(() => {
    if (words.length) startNewGame();
  }, [words, startNewGame]);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}words.txt`)
      .then((res) => res.text())
      .then((text) => {
        const list = text
          .split("\n")
          .map((w) => w.trim())
          .filter(Boolean);
        setWords(list);
        setPos(list);
      });

    fetch(`${import.meta.env.BASE_URL}likely.txt`)
      .then((res) => res.text())
      .then((text) =>
        setLikely(
          text
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean)
        )
      );
  }, []);

  const handleSubmit = () => {
    const guess = userGuess.toLowerCase();
    const fb = feedback.toLowerCase();
    if (!/^[a-z]{5}$/.test(guess) || !/^[bgy]{5}$/i.test(fb)) {
      setError("Enter 5-letter guess and 5-char feedback (b,g,y)");
      return;
    }
    setError("");
    setLoading(true);
    const feedbackArr = fb.split("");
    // update grid
    setLettersArr((prev) => {
      const next = [...prev];
      next[row] = guess.split("");
      return next;
    });
    setColorsArr((prev) => {
      const next = [...prev];
      next[row] = feedbackArr;
      return next;
    });
    if (fb === "ggggg") {
      setWon(true);
      setLoading(false);
      return;
    }
    // filter possible words by matching all feedbacks including this one
    // build arrays for filtering
    const newLettersArr = lettersArr.map((rowArr, idx) =>
      idx === row ? guess.split("") : rowArr
    );
    const newColorsArr = colorsArr.map((colArr, idx) =>
      idx === row ? feedbackArr : colArr
    );
    const filtered = pos.filter((word) => {
      for (let r = 0; r <= row; r++) {
        const gWord = newLettersArr[r].join("");
        const fStr = newColorsArr[r].join("");
        if (getFeedback(gWord, word) !== fStr) return false;
      }
      return true;
    });
    if (filtered.length === 0) {
      setImpossible(true);
      setLoading(false);
      return;
    }
    setPos(filtered);
    const { best, top } = findBestGuess(filtered, false);
    setNextGuess(best);
    setTopGuesses(top);
    // next row
    setRow((r) => r + 1);
    setLoading(false);
    setUserGuess("");
    setFeedback("");
  };

  return (
    <div
      className={`${colorMap.default} min-h-[110vh] flex flex-col items-center`}
    >
      <h1 className="text-blue-300 text-3xl font-bold mt-8">Wordle Solver</h1>
      <div className="flex flex-row w-full justify-center items-start mt-8">
        <div className="flex flex-col items-center">
          <Grid letters={lettersArr} colors={colorsArr} />
          <input
            className="w-2/3 p-2 border border-gray-700 rounded bg-zinc-900 text-white mb-2 mt-6"
            placeholder="Guess word"
            value={userGuess}
            onChange={(e) => setUserGuess(e.target.value)}
            maxLength={5}
          />
          <input
            className="w-2/3 p-2 border border-gray-700 rounded bg-zinc-900 text-white mb-2"
            placeholder="Feedback bgy"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            maxLength={5}
          />
          <button
            onClick={handleSubmit}
            className="mb-4 px-4 py-2 bg-green-600 text-white rounded"
          >
            Submit
          </button>
        </div>
        <div className="flex flex-col">
          <div className="text-white text-left ml-10 p-4 border border-gray-700 rounded-lg bg-zinc-900">
            <h3 className="font-bold text-lg mb-2">Top Suggestions</h3>
            <ul>
              {topGuesses.map(({ guess, worstCase, entropy }, idx) => (
                <li
                  key={guess}
                  className="font-mono fade-in text-white"
                  style={{
                    animationDelay: `${idx * 100}ms`,
                    animationDuration: `${200 + idx * 50}ms`
                  }}
                >
                  {guess.toUpperCase()} - {entropy.toFixed(2)} bits, worst{" "}
                  {worstCase}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full text-center mt-4">
            <p className="text-white">Remaining possibilities: {pos.length}</p>
            <button
              onClick={startNewGame}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
            >
              New Game
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-row">
        <div className="flex flex-col items-center w-full mt-4">
          {error && <p className="text-red-500 mt-2">{error}</p>}

          {won && (
            <div className="text-blue-400 text-center mt-4 text-2xl font-bold">
              <p>
                Congratulations! You've solved it!{" "}
                <PartyPopper
                  className="inline-block"
                  color="purple"
                  size={24}
                />
              </p>
            </div>
          )}
          {impossible && (
            <div className="text-red-500 text-center mt-4 text-2xl font-bold">
              <p>
                Hmm, something's off. No possible words match that feedback.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Solver;
