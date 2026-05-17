import { wordlister } from "./wordlister.js";

export class WordleEngine {
    constructor(config) {
        this.wordLength = 5;    // standard Wordle length
        this.maxGuesses = 6;    // default amount of guesses (guess rows)
        this.diacriticMap = config.diacriticMap || {};  // useful for normalizing characters for matching and color assignment
        this.lang = config.langFolder;          // store language for info display
        this.langFolder = config.langFolder;    // folder where the word list is located
        this.fileName = config.fileName;        // name of the word list file in the lemma folder
        
        this.allWords = [];             // holds the full list of valid words loaded from the file
        this.targetWordLiteral = "";    // the actual target word as a string (for display and reference)
        this.targetWordTokens = [];     // the target word split into tokens (characters/digraphs) for processing guesses
        this.targetWordNorm = [];       // the target word normalized for comparison
        this.guessesTokens = [];        // array of all guesses (as tokens)
        this.currentGuessTokens = [];   // the current guess being processed
        this.gameOver = false;          // flag to prevent input after game ends
    }

    // default tokenization splits the word into characters (no digraphs/trigraphs)
    tokenize(word) {
        return word.split('');
    }

    // replaces diacritical characters with their base forms for comparison and color logic
    normalizeToken(token) {
        return token.split('').map(char => this.diacriticMap[char] || char).join('');
    }

    // loads the word list and initializes game
    async initGame() {
        try {
            const response = await fetch(`lemma/${this.langFolder}/${this.fileName}`);
            const text = await response.text();
            // store all words in lowercase for consistent processing (removes empty lines)
            this.allWords = text.split('\n').map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
            this.addWordleInfo();
            this.addResetButton();
            this.resetGame();
        } catch (e) {
            console.error(`Could not load ${this.fileName}`, e);
        }
    }

    // resets the game and selects a new target word
    resetGame() {
        const validWords = this.allWords.filter(w => this.tokenize(w).length === this.wordLength);
        this.targetWordLiteral = validWords[Math.floor(Math.random() * validWords.length)];
        this.targetWordTokens = this.tokenize(this.targetWordLiteral);
        this.targetWordNorm = this.targetWordTokens.map(t => this.normalizeToken(t));
        
        this.guessesTokens = [];
        this.currentGuessTokens = [];
        this.gameOver = false;
        this.drawBoard();
        this.updatePossibleWords();
    }

    // determines the color for each token in a guess
    getRowColors(guessTokens, targetTokens) {
        const colors = Array(this.wordLength).fill("gray");
        const targetNorm = targetTokens.map(t => this.normalizeToken(t));
        const guessNorm = guessTokens.map(t => this.normalizeToken(t));
        const availableNorm = [...targetNorm];

        // identify correct positions (green/dark-green)
        for (let i = 0; i < this.wordLength; i++) {
            if (guessNorm[i] === targetNorm[i]) {
                colors[i] = (guessTokens[i] === targetTokens[i]) ? "green" : "dark-green"; 
                availableNorm[i] = null; 
            }
        }

        // identify present but misplaced tokens (yellow/dark-yellow)
        for (let i = 0; i < this.wordLength; i++) {
            const idx = availableNorm.indexOf(guessNorm[i]);
            // if the token is available in the target word (not already green)
            if (idx !== -1 && colors[i] === "gray") {
                const literalExists = targetTokens.some((t, tIdx) => availableNorm[tIdx] !== null && t === guessTokens[i]);
                colors[i] = literalExists ? "yellow" : "dark-yellow";
                availableNorm[idx] = null;
            }
        }
        return colors;
    }

    // initializes the board with empty tokens and default colors
    drawBoard() {
        const board = document.getElementById('game-board');
        board.innerHTML = '';
        for (let i = 0; i < this.maxGuesses; i++) {
            const row = document.createElement('div');
            row.className = "game-row";
            const guess = this.guessesTokens[i];
            const colors = guess ? this.getRowColors(guess, this.targetWordTokens) : [];

            for (let j = 0; j < this.wordLength; j++) {
                const box = document.createElement('span');
                box.className = "game-box";

                // if there's a guess (filled) for this row, fill in the token and color
                // otherwise, show current guess tokens without colors
                if (guess) {
                    box.textContent = guess[j];
                    box.className = `game-box white-text ${colors[j]}`;
                } else if (i === this.guessesTokens.length && this.currentGuessTokens[j]) {
                    box.textContent = this.currentGuessTokens[j];
                }
                row.appendChild(box);
            }
            board.appendChild(row);
        }
    }

    // filters the word list based on the guesses and their colors
    updatePossibleWords() {
        const candidates = this.allWords.filter(word => {
            const wordTokens = this.tokenize(word);
            if (wordTokens.length !== this.wordLength) return false;
            return this.guessesTokens.every(guess => {
                const expected = this.getRowColors(guess, wordTokens);
                const actual = this.getRowColors(guess, this.targetWordTokens);
                return expected.every((color, idx) => color === actual[idx]);
            });
        });

        // limit the number of suggestions to avoid overwhelming the user
        const limit = 200;
        wordlister(this.langFolder, candidates, limit);
    }

    // adds informational text about the game and language specifics to the page
    addWordleInfo(isSolver = false) {
        const infoText = document.getElementById('wordle-info');
        if (infoText) {
            infoText.innerHTML = `
                <p>
                ${isSolver ? "Click on the boxes to cycle through colors." : ""}
                Enter your guesses using the keyboard. Use Backspace to delete.
                The solver will suggest possible words based on your inputs.
                </p>
                <p>
                Note:
                ${this.lang === 'javanese' ? "Javanese" : "Hungarian"} words contain
                ${this.lang === 'javanese' ?
                    "diacritical marks" :
                    "diacritical marks, digraphs and trigraphs"}.
                ${isSolver ?
                    "The solver recognizes these and will help you find the correct word." :
                    "Making a guess with the wrong diacritics will still count as correct/present, but will be indicated with a different color."}
                </p>
                <p>
                For additional information, see the page about the
                ${this.lang === 'javanese' ?
                    "<a href='dictionary.html?lang=javanese'>Javanese Language</a>" :
                    "<a href='dictionary.html?lang=hungarian'>Hungarian Language</a>"}.
                </p>
            `;
        }
    }

    // allows restarting the game by clicking the reset button
    addResetButton() {
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                this.resetGame();
                e.target.blur();
                console.log("Game reset");
            });
        }
    }
}
