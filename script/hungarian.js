const WORD_LENGTH = 5;
const MAX_GUESSES = 6;
const DIGRAPHS = ["dzs", "dz", "cs", "gy", "ly", "ny", "sz", "ty"];

const DIACRITIC_MAP = {
    'á': 'a', 'é': 'e', 'í': 'i',
    'ó': 'o', 'ö': 'o', 'ő': 'o',
    'ú': 'u', 'ü': 'u', 'ű': 'u'
};

let allWords = [];
let targetWordLiteral = "";
let targetWordTokens = [];
let targetWordNorm = [];
let guessesTokens = [];
let currentGuessTokens = [];
let gameOver = false;

function tokenize(word) {
    let tokens = [];
    let i = 0;
    while (i < word.length) {
        let found = false;
        for (let combo of DIGRAPHS) {
            if (word.substring(i).startsWith(combo)) {
                tokens.push(combo);
                i += combo.length;
                found = true;
                break;
            }
        }
        if (!found) {
            tokens.push(word[i]);
            i++;
        }
    }
    return tokens;
}

function normalizeToken(token) {
    return token.split('').map(char => DIACRITIC_MAP[char] || char).join('');
}

async function initGame() {
    try {
        const response = await fetch('words_hungarian.txt');
        const text = await response.text();
        allWords = text.split('\n').map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
        resetGame();
    } catch (e) {
        console.error("Could not load words_hungarian.txt", e);
    }
}

function resetGame() {
    const validWords = allWords.filter(w => tokenize(w).length === WORD_LENGTH);
    targetWordLiteral = validWords[Math.floor(Math.random() * validWords.length)];
    targetWordTokens = tokenize(targetWordLiteral);
    targetWordNorm = targetWordTokens.map(normalizeToken);
    
    guessesTokens = [];
    currentGuessTokens = [];
    gameOver = false;
    document.getElementById('message').textContent = "";
    drawBoard();
    updatePossibleWords();
}

function getRowColors(guessTokens, targetLiteralOverride = null) {
    const colors = Array(WORD_LENGTH).fill("grey");
    const tTokens = targetLiteralOverride ? tokenize(targetLiteralOverride) : targetWordTokens;
    const tNorm = tTokens.map(normalizeToken);
    const availableNorm = [...tNorm];
    const gNorm = guessTokens.map(normalizeToken);

    for (let i = 0; i < WORD_LENGTH; i++) {
        if (gNorm[i] === tNorm[i]) {
            colors[i] = (guessTokens[i] === tTokens[i]) ? "#6aaa64" : "#4a7a44"; 
            availableNorm[i] = null; 
        }
    }

    for (let i = 0; i < WORD_LENGTH; i++) {
        if (!colors[i].startsWith("#")) { 
            const idx = availableNorm.indexOf(gNorm[i]);
            if (idx !== -1) {
                const literalExists = tTokens.some((t, tIdx) => 
                    availableNorm[tIdx] !== null && t === guessTokens[i]
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
        const wordTokens = tokenize(word);
        if (wordTokens.length !== WORD_LENGTH) return false;

        for (let i = 0; i < guessesTokens.length; i++) {
            const guess = guessesTokens[i];
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
        const guess = guessesTokens[i];
        const colors = guess ? getRowColors(guess) : [];

        for (let j = 0; j < WORD_LENGTH; j++) {
            const box = document.createElement('span');
            box.style.border = "1px solid black";
            box.style.width = "60px";
            box.style.height = "40px";
            box.style.display = "inline-block";
            box.style.textAlign = "center";
            box.style.lineHeight = "40px";
            box.style.margin = "2px";
            box.style.color = guess ? "white" : "black";

            if (guess) {
                box.textContent = guess[j];
                box.style.backgroundColor = colors[j];
            } else if (i === guessesTokens.length && currentGuessTokens[j]) {
                box.textContent = currentGuessTokens[j];
            }
            row.appendChild(box);
        }
        board.appendChild(row);
    }
}

window.addEventListener('keydown', (e) => {
    if (gameOver) return;

    if (e.key === 'Enter' && currentGuessTokens.length === WORD_LENGTH) {
        const guessNorm = currentGuessTokens.map(normalizeToken).join('');
        const targetNormStr = targetWordNorm.join('');
        guessesTokens.push([...currentGuessTokens]);

        if (guessNorm === targetNormStr) {
            document.getElementById('message').innerHTML = `Victory! The word is: <strong>${targetWordLiteral}</strong>`;
            gameOver = true;
        } else if (guessesTokens.length === MAX_GUESSES) {
            document.getElementById('message').innerHTML = `Game Over. The word was: <strong>${targetWordLiteral}</strong>`;
            gameOver = true;
        }
        currentGuessTokens = [];
        updatePossibleWords();
    } else if (e.key === 'Backspace') {
        currentGuessTokens.pop();
    } else if (/^[a-z|áéíóöőúüű]$/i.test(e.key) && currentGuessTokens.length <= WORD_LENGTH) {
        let char = e.key.toLowerCase();
        let lastIdx = currentGuessTokens.length - 1;
        
        if (lastIdx >= 0) {
            let combo = currentGuessTokens[lastIdx] + char;
            if (DIGRAPHS.includes(combo) || (currentGuessTokens[lastIdx] === "dz" && char === "s")) {
                currentGuessTokens[lastIdx] = combo;
            } else if (currentGuessTokens.length < WORD_LENGTH) {
                currentGuessTokens.push(char);
            }
        } else if (currentGuessTokens.length < WORD_LENGTH) {
            currentGuessTokens.push(char);
        }
    }
    drawBoard();
});

document.getElementById('reset-btn').addEventListener('click', resetGame);
initGame();
