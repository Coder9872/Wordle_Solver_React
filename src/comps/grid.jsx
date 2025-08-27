import { string } from "prop-types";

// removed Tailwind colorMap: use raw hex for flip animation

const colorHex = {
     g: '#538d4f',
     y: '#b4a03b',
     b: '#3a393c',
     black: '#000000',
     default: '#121212',
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

            {letters.map((row, rowIdx) => (
                <div key={rowIdx} className='flex flex-row mb-0.5' id={`row-${rowIdx}`}>
                    {row.map((letter, colIdx) => (
                        <div
                            key={colIdx}
                            className={`letter-box ${letter ? 'flip-in' : ''}`}
                            style={{
                                '--tile-color': colorHex[colors[rowIdx][colIdx]] || colorHex.default,
                                animationDelay: `${colIdx * 300}ms`
                            }}
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