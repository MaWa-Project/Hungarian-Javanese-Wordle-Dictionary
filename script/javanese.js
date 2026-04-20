const WORD_LENGTH = 5;
const MAX_GUESSES = 6;
const DIACRITIC_MAP = { 'é': 'e', 'è': 'e', 'å': 'a' };

let allWords = [];
let targetWordLiteral = "";
let guesses = [];
let currentGuess = [];
let gameOver = false;

function normalize(word) {
    return word.split('').map(c => DIACRITIC_MAP[c] || c).join('');
}

async function initGame() {
    try {
        const response = await fetch('lemma/javanese/words_javanese.txt');
        const text = await response.text();
        allWords = text.split('\n').map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
        resetGame();
    } catch (e) {
        console.error("Could not load words_javanese.txt", e);
    }
}

function resetGame() {
    targetWordLiteral = allWords[Math.floor(Math.random() * allWords.length)];
    guesses = [];
    currentGuess = [];
    gameOver = false;
    document.getElementById('message').textContent = "";
    drawBoard();
    updatePossibleWords();
}

function getRowColors(guess, targetOverride = null) {
    const colors = Array(WORD_LENGTH).fill("grey");
    const target = targetOverride || targetWordLiteral;
    const tNorm = normalize(target).split('');
    const gNorm = normalize(guess).split('');
    const availableNorm = [...tNorm];

    for (let i = 0; i < WORD_LENGTH; i++) {
        if (gNorm[i] === tNorm[i]) {
            colors[i] = (guess[i] === target[i]) ? "#6aaa64" : "#4a7a44";
            availableNorm[i] = null;
        }
    }

    for (let i = 0; i < WORD_LENGTH; i++) {
        if (!colors[i].startsWith("#")) {
            const idx = availableNorm.indexOf(gNorm[i]);
            if (idx !== -1) {
                const literalExists = target.split('').some((char, tIdx) => 
                    availableNorm[tIdx] !== null && char === guess[i]
                );
                colors[i] = literalExists ? "#c9b458" : "#91823f";
                availableNorm[idx] = null;
            }
        }
    }
    return colors;
}

function updatePossibleWords() {
    const listContainer = document.getElementById('possible-words');

    const candidates = allWords.filter(word => {
        for (let i = 0; i < guesses.length; i++) {
            const guess = guesses[i];
            const expectedColors = getRowColors(guess, word);
            const actualColors = getRowColors(guess);
            for (let c = 0; c < WORD_LENGTH; c++) {
                if (expectedColors[c] !== actualColors[c]) return false;
            }
        }
        return true;
    });

    if (candidates.length === 0) {
        listContainer.innerHTML = "<p>No words found.</p>";
        return;
    }

    let html = `<strong>Words found: ${candidates.length}</strong><ul>`;
    const limit = 200;
    const displayList = candidates.slice(0, limit);

    displayList.forEach(word => {
        html += `<li>${word}</li>`;
    });

    html += "</ul>";
    if (candidates.length > limit) {
        html += `<p><em>...and ${candidates.length - limit} more words (too many to display).</em></p>`;
    }
    
    listContainer.innerHTML = html;
}

function drawBoard() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    for (let i = 0; i < MAX_GUESSES; i++) {
        const row = document.createElement('div');
        const guessStr = guesses[i];
        const colors = guessStr ? getRowColors(guessStr) : [];

        for (let j = 0; j < WORD_LENGTH; j++) {
            const box = document.createElement('span');
            box.style.border = "1px solid black";
            box.style.width = "40px";
            box.style.height = "40px";
            box.style.display = "inline-block";
            box.style.textAlign = "center";
            box.style.lineHeight = "40px";
            box.style.margin = "2px";
            box.style.color = guessStr ? "white" : "black";

            if (guessStr) {
                box.textContent = guessStr[j];
                box.style.backgroundColor = colors[j];
            } else if (i === guesses.length && currentGuess[j]) {
                box.textContent = currentGuess[j];
            }
            row.appendChild(box);
        }
        board.appendChild(row);
    }
}

window.addEventListener('keydown', (e) => {
    if (gameOver) return;
    if (e.key === 'Enter' && currentGuess.length === WORD_LENGTH) {
        const guess = currentGuess.join('');
        guesses.push(guess);
        if (normalize(guess) === normalize(targetWordLiteral)) {
            document.getElementById('message').innerHTML = `Victory! The word is: <strong>${targetWordLiteral}</strong>`;
            gameOver = true;
        } else if (guesses.length === MAX_GUESSES) {
            document.getElementById('message').innerHTML = `Game Over. The word was: <strong>${targetWordLiteral}</strong>`;
            gameOver = true;
        }
        currentGuess = [];
        updatePossibleWords();
    } else if (e.key === 'Backspace') {
        currentGuess.pop();
    } else if (/^[a-z\u00C0-\u017F]$/i.test(e.key) && currentGuess.length < WORD_LENGTH) {
        currentGuess.push(e.key.toLowerCase());
    }
    drawBoard();
});

document.getElementById('reset-btn').addEventListener('click', resetGame);
initGame();
