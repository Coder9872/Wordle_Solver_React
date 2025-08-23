import { string } from "prop-types";

const colorMap = {
    g: 'bg-[#538d4f]',
    y: 'bg-[#b4a03b]',
    b: 'bg-[#3a393c]',
    black: 'bg-black',
    default: 'bg-[#121212]',
};
const defaultLetters = Array.from({ length: 6 }, () => Array(5).fill(''));
const defaultColors = Array.from({ length: 6 }, () => Array(5).fill('default'));
function stringsTo2DArray(words, rows = 6, cols = 5) {
  return Array.from({ length: rows }, ( _ , r) => {
    const w = words[r] || '';
    return Array.from({ length: cols }, ( _ , c) => w[c] || '');
  });
}
function Grid({ letters = defaultLetters, colors = defaultColors }) {
    letters = stringsTo2DArray(letters);
    colors = stringsTo2DArray(colors);
    return (
        <div className='flex justify-center flex-col items-center '>
            <h1 className='text-4xl font-bold text-blue-200 mb-8 mt-8'>Wordle Solver</h1>

            {letters.map((row, rowIdx) => (
                <div key={rowIdx} className='flex flex-row mb-0.5' id={`row-${rowIdx}`}>
                    {row.map((letter, colIdx) => (
                        <div
                            key={colIdx}
                            className={`letter-box ${colorMap[colors[rowIdx][colIdx]] || colorMap.default}`}
                        >
                            {letter}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

export default Grid;