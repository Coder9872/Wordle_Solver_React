import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Grid from '../comps/grid.jsx';
import { Loader2, PartyPopper } from 'lucide-react';
import { filterWords, findBestGuess} from '../utils/solverUtils';

const colorMap = {
    green: 'bg-[#538d4f]',
    gray: 'bg-[#3a393c]',
    yellow: 'bg-[#b4a03b]',
    black: 'bg-black',
    default: 'bg-[#121212]',
};
let grays = []
let greens = Array(5).fill(null)
let yellows = Array(5).fill().map(() => [])
function updateFeedback(guess, feedback){
    for (let i = 0; i < 5; i++) {
        if (feedback[i] === 'g') {
            greens[i] = guess[i];
        } else if (feedback[i] === 'y') {
            if (!yellows[i].includes(guess[i])) {
                yellows[i].push(guess[i]);
            }
        } else if (feedback[i] === 'b') {
            if (!grays.includes(guess[i])) {
                grays.push(guess[i]);
            }
        }

    }
}



// initialize 6x5 grid arrays for letters and colors
let Letters = Array.from({ length: 6 }, () => Array(5).fill(''));
let Colors = Array.from({ length: 6 }, () => Array(5).fill('default'));
// initial predicted word in row 0
Letters[0] = 'tares'.split('');
function Solver() {
    const [words, setWords] = useState([]);
    const [likely, setLikely] = useState([]);
    // candidate list state
    const [pos, setPos] = useState([]);
    // current row index for guesses
    const [row, setRow] = useState(0);
    // state for the user input
    const [guess, setGuess] = useState('');
    // error message for invalid guess
    const [error, setError] = useState('');
    // grid letters and colors in state
    const [lettersArr, setLettersArr] = useState(Letters);
    const [colorsArr, setColorsArr] = useState(Colors);
    // next proposed guess and loading state
    const [nextGuess, setNextGuess] = useState('');
    const [loading, setLoading] = useState(false);
    const computeTimer = useRef(null);
    const [won, setWon] = useState(false);

    useEffect(() => {
        fetch('../words.txt')
            .then(res => res.text())
            .then(text => {
                const list = text.split('\n').map(w => w.trim()).filter(Boolean);
                setWords(list);
                setPos(list);
            });

        fetch('../likely.txt')
            .then(res => res.text())
            .then(text => setLikely(text.split('\n').map(likelyWord => likelyWord.trim()).filter(Boolean)));
    }, []);

    // handle Enter key in input to process the guess (debounced)
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            // only allow b, g, y characters and exactly 5
            const validPattern = /^[bgy]{5}$/;
            if (!validPattern.test(guess)) {
                setError('Guess must be 5 characters and only b, g, or y');
                return;
            }
            setError('');
            setLoading(true);
            // capture the current guess before clearing it
            const userGuess = guess;
            if (userGuess === 'ggggg') {
                setWon(true);
                setLoading(false);
                setColorsArr(prev => {
                    const nextCols = [...prev];
                    const feedbackArr = userGuess.split('');
                    nextCols[row] = feedbackArr;
                    return nextCols;
                });
                return;
            }
            clearTimeout(computeTimer.current);
            // debounce heavy computation by 300ms
            computeTimer.current = setTimeout(() => {
                const feedbackArr = userGuess.split('');
                const currentWord = lettersArr[row];
                updateFeedback(currentWord, feedbackArr);
                // update candidate list using pure JS utility
                const filtered = filterWords(pos, greens, yellows, grays);
                setPos(filtered);
                // compute next guess using utility (always subsequent guess)
                const next = findBestGuess(filtered, false);
                setNextGuess(next);
                setColorsArr(prev => {
                    const nextCols = [...prev];
                    nextCols[row] = feedbackArr;
                    return nextCols;
                });
                setLettersArr(prev => {
                    const nextLtrs = [...prev];
                    nextLtrs[row + 1] = next.split('');
                    return nextLtrs;
                });
                setRow(r => r + 1);
                setLoading(false);
                console.log('User guess:', userGuess, '=> next:', next);
                // clear input after processing
                setGuess('');
            }, 200);
         }
     };

    return (
        <div className={`${colorMap.default} h-screen flex flex-col`}>
            <Grid letters={lettersArr} colors={colorsArr}/>
            <input
                className="w-1/4 mt-8 p-2 border border-gray-700 rounded bg-zinc-900 text-white mx-auto"
                placeholder="Enter your guess"
                value={guess}
                onChange={e => setGuess(e.target.value.toLowerCase())}
                onKeyDown={handleKeyDown}
                maxLength={5}
            />
           {error && (
                <p className="text-red-500 text-center mt-2">{error}</p>
           )}
          <div className="text-white text-center mt-4">
             Next proposed guess: {' '}
             {loading ? (
               <Loader2 className="inline-block animate-spin" size={16} />
             ) : (
               <span className="font-bold">{lettersArr[row]}</span>
             )}
          </div>
            {won && (
                <div className="text-blue-400 text-center mt-4 text-2xl font-bold">
                    <p>Congratulations! You've solved it! <PartyPopper className="inline-block" color="purple" size={24} /></p>
                </div>
            )}

         </div>

    )
}

export default Solver;