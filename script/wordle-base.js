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
        this.guessesTokens = Array.from({ length: 6 }, () => Array(5).fill(""));        // array of all guesses (as tokens)
        this.guessesColors = Array.from({ length: 6 }, () => Array(5).fill("initial")); // array of all guesses (as colors)
        this.currentGuessTokens = [];   // the current guess being processed
        this.gameOver = false;          // flag to prevent input after game ends
        
        this.activeRow = 0;             // tracks which guess row is currently active for input
        this.isSolverMode = false;      // solver mode has different key handling and doesn't end the game on correct guess
        this.onBoxClick = null;         // click callback for solver interactions
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

            this.addWordleInfo(this.isSolverMode);
            this.addResetButton();
            this.resetGame();
            this.addKeyboard();
        } catch (e) {
            console.error(`Could not load ${this.fileName}`, e);
        }
    }

    // resets the game and selects a new target word
    resetGame() {
        const validWords = this.allWords.filter(w => this.tokenize(w).length === this.wordLength);
        if (validWords.length === 0) return;
        this.targetWordLiteral = validWords[Math.floor(Math.random() * validWords.length)];
        this.targetWordTokens = this.tokenize(this.targetWordLiteral);
        this.targetWordNorm = this.targetWordTokens.map(t => this.normalizeToken(t));
        
        this.guessesTokens = Array.from({ length: 6 }, () => Array(5).fill(""));
        this.guessesColors = Array.from({ length: 6 }, () => Array(5).fill("initial"));
        this.currentGuessTokens = [];
        this.activeRow = 0;
        this.gameOver = false;

        this.drawBoard();
        this.updatePossibleWords();
    }

    // appends a character to the current guess if it doesn't exceed the word length
    appendChar(char) {
        if (this.currentGuessTokens.length < this.wordLength) {
            this.currentGuessTokens.push(char);
        }
    }

    // handles keyboard input for making guesses, deleting characters, and submitting guesses
    handleKey(e) {
        // prevent input if game is over
        if (this.gameOver) return;

        // if Enter is pressed and current guess has 5 tokens, process the guess
        if (e.key === 'Enter' && this.currentGuessTokens.length === this.wordLength) {
            if (this.isSolverMode) {
                this.guessesTokens[this.activeRow] = [...this.currentGuessTokens];
                if (this.activeRow < this.maxGuesses - 1) this.activeRow++;
                this.currentGuessTokens = [];
            } else {
                const guessNorm = this.currentGuessTokens.map(t => this.normalizeToken(t)).join('');
                const targetNorm = this.targetWordNorm.join('');
                
                this.guessesTokens[this.activeRow] = [...this.currentGuessTokens];
                this.guessesColors[this.activeRow] = this.getRowColors(this.currentGuessTokens, this.targetWordTokens);

                if ((guessNorm === targetNorm) || (this.activeRow === this.maxGuesses - 1)) {
                    this.gameOver = true;
                }
                
                this.activeRow++;
                this.currentGuessTokens = [];
            }
            this.updatePossibleWords();
        }
        // if Backspace is pressed, remove the last token from the current row
        else if (e.key === 'Backspace') {
            // if there are tokens in the current guess, remove the last one
            if (this.currentGuessTokens.length > 0) {
                this.currentGuessTokens.pop();
                if (this.isSolverMode) this.updatePossibleWords();
            }
            // if the current guess is empty and we're in solver mode, allow going back to the previous row
            else if (this.isSolverMode && this.activeRow > 0) {
                this.activeRow--;
                this.currentGuessTokens = [...this.guessesTokens[this.activeRow]];
                this.guessesTokens[this.activeRow] = Array(5).fill("");
                this.currentGuessTokens.pop();
                
                this.updatePossibleWords();
            }
        }
        // if a valid character key is pressed, append it to the current guess
        else if (/^[a-z|áéíóöőúüűåèé\u00C0-\u017F]$/i.test(e.key)) {
            const char = e.key.toLowerCase();

            // in solver mode, if the current guess is already full, we check if adding the new character would form a digraph/trigraph
            // if not, we move to the next row before appending the character
            if (this.isSolverMode && this.currentGuessTokens.length === this.wordLength) {
                let formsDigraph = false;
                
                // check if adding the new character would form a digraph/trigraph
                if (this.DIGRAPHS && this.currentGuessTokens.length > 0) {
                    const lastToken = this.currentGuessTokens[this.currentGuessTokens.length - 1];
                    const combo = lastToken + char;
                    if (this.DIGRAPHS.includes(combo) || (lastToken === "dz" && char === "s")) {
                        formsDigraph = true;
                    }
                }

                // move to the next row before appending the character
                if (!formsDigraph) {
                    if (this.activeRow < this.maxGuesses - 1) {
                        this.guessesTokens[this.activeRow] = [...this.currentGuessTokens];
                        this.activeRow++;
                        this.currentGuessTokens = [];
                    }
                }
            }

            this.appendChar(char);
            if (this.isSolverMode) this.updatePossibleWords();
        }
        this.drawBoard();
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
        if (!board) return;
        board.innerHTML = '';

        for (let i = 0; i < this.maxGuesses; i++) {
            const row = document.createElement('div');
            row.className = "game-row";

            for (let j = 0; j < this.wordLength; j++) {
                const box = document.createElement('span');
                box.className = "game-box";

                // from current guess if it's the active row
                // otherwise from the stored guesses
                let token = "";
                if (i === this.activeRow) {
                    token = this.currentGuessTokens[j] || "";
                } else {
                    token = this.guessesTokens[i][j] || "";
                }

                box.textContent = token;

                // assign colors based on the guess
                if (token) {
                    const stateColor = this.guessesColors[i][j];
                    if (!this.isSolverMode && stateColor === "initial") {
                        box.classList.add("white");
                    } else {
                        box.classList.add("white-text");
                        box.classList.add(stateColor === "initial" ? "gray" : stateColor);
                    }
                }
                
                // in solver mode, allow clicking on boxes to change their color
                if (this.isSolverMode && this.onBoxClick && token && i <= this.activeRow) {
                    box.onclick = () => this.onBoxClick(i, j);
                    box.style.cursor = "pointer";
                }

                row.appendChild(box);
            }
            board.appendChild(row);
        }
    }

    // filters the word list based on the guesses and their colors
    updatePossibleWords() {
        const listContainer = document.getElementById('word-list');
        if (!listContainer) return;

        const candidates = this.allWords.filter(word => {
            const wordTokens = this.tokenize(word);
            if (wordTokens.length !== this.wordLength) return false;

            const checkLimit = this.isSolverMode ? this.maxGuesses : this.activeRow;
            for (let r = 0; r < checkLimit; r++) {
                let rowTokens = this.guessesTokens[r];
                let rowColors = this.guessesColors[r];

                if (this.isSolverMode && r === this.activeRow) {
                    rowTokens = Array(this.wordLength).fill("");
                    for (let j = 0; j < this.currentGuessTokens.length; j++) {
                        rowTokens[j] = this.currentGuessTokens[j];
                    }
                }

                if (!rowTokens || rowTokens.every(t => t === "")) continue;

                const expectedColors = this.getRowColors(rowTokens, wordTokens);
                const actualColors = this.isSolverMode ? rowColors : this.getRowColors(rowTokens, this.targetWordTokens);

                for (let t = 0; t < this.wordLength; t++) {
                    if (rowTokens[t] === "") continue;

                    const currentColor = actualColors[t];
                    const logicColor = (currentColor === "initial" || currentColor === "gray") ? "gray" : currentColor;

                    if (expectedColors[t] !== logicColor) return false;
                }
            }
            return true;
        });

        // limit the number of suggestions to avoid overwhelming the user
        const limit = 200;
        wordlister(this.langFolder, candidates, limit);
    }

    // creates an on-screen keyboard for phone users
    addKeyboard() {
        const keyboard = document.getElementById('keyboard');
        if (!keyboard) return;
        keyboard.innerHTML = '';

        // blueprint for how the keys should appear on screen
        const bindings = [
            [ "ö", "ü", "ő", "ű", "ó", "ú", "Backspace", "Enter" ],
            [ "q", "w", "e", "r", "t", "z", "u", "i", "o", "p" ],
            [ "a", "s", "d", "f", "g", "h", "j", "k", "l", "é" ],
            [ "í", "y", "x", "c", "v", "b", "n", "m", "á" ]
        ]

        // creates the keyboard HTML and adds eventListeners that link to handleKey
        bindings.forEach((keyrow) => {
            const row = document.createElement('div');
            row.className = "key-row";
            keyrow.forEach((key) => {
                const button = document.createElement('button');
                button.className = "key-box";
                button.innerHTML = key;
                const buttonInput = { "key": key };
                button.addEventListener('pointerdown', (e) => {
                    this.handleKey(buttonInput);
                    button.blur();
                });
                row.appendChild(button);
            });
            keyboard.appendChild(row);
        });
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
            });
        }
    }
}
