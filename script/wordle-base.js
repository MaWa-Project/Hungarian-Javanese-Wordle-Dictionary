import { wordlister } from "./wordlister.js";

export class WordleEngine {
    constructor(config) {
        this.wordLength = 5;
        this.maxGuesses = 6;
        this.diacriticMap = config.diacriticMap || {};
        this.langFolder = config.langFolder;
        this.fileName = config.fileName;
        
        this.allWords = [];
        this.targetWordLiteral = "";
        this.targetWordTokens = [];
        this.targetWordNorm = [];
        this.guessesTokens = [];
        this.currentGuessTokens = [];
        this.gameOver = false;
    }

    tokenize(word) {
        return word.split('');
    }

    normalizeToken(token) {
        return token.split('').map(char => this.diacriticMap[char] || char).join('');
    }

    async initGame() {
        try {
            const response = await fetch(`lemma/${this.langFolder}/${this.fileName}`);
            const text = await response.text();
            this.allWords = text.split('\n').map(w => w.trim().toLowerCase()).filter(w => w.length > 0);
            this.resetGame();
        } catch (e) {
            console.error(`Could not load ${this.fileName}`, e);
        }
    }

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

    getRowColors(guessTokens, targetLiteralOverride = null) {
        const colors = Array(this.wordLength).fill("gray");
        const tTokens = targetLiteralOverride ? this.tokenize(targetLiteralOverride) : this.targetWordTokens;
        const tNorm = tTokens.map(t => this.normalizeToken(t));
        const availableNorm = [...tNorm];
        const gNorm = guessTokens.map(t => this.normalizeToken(t));

        for (let i = 0; i < this.wordLength; i++) {
            if (gNorm[i] === tNorm[i]) {
                colors[i] = (guessTokens[i] === tTokens[i]) ? "green" : "dark-green"; 
                availableNorm[i] = null; 
            }
        }

        for (let i = 0; i < this.wordLength; i++) {
            if (!colors[i].startsWith("#")) { 
                const idx = availableNorm.indexOf(gNorm[i]);
                if (idx !== -1) {
                    const literalExists = tTokens.some((t, tIdx) => availableNorm[tIdx] !== null && t === guessTokens[i]);
                    colors[i] = literalExists ? "yellow" : "dark-yellow";
                    availableNorm[idx] = null;
                }
            }
        }
        return colors;
    }

    drawBoard() {
        const board = document.getElementById('game-board');
        board.innerHTML = '';
        for (let i = 0; i < this.maxGuesses; i++) {
            const row = document.createElement('div');
            row.className = "game-row";
            const guess = this.guessesTokens[i];
            const colors = guess ? this.getRowColors(guess) : [];

            for (let j = 0; j < this.wordLength; j++) {
                const box = document.createElement('span');
                box.className = "game-box";

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

    updatePossibleWords() {
        const listContainer = document.getElementById('word-list');
        
        const candidates = this.allWords.filter(word => {
            const wordTokens = this.tokenize(word);
            if (wordTokens.length !== this.wordLength) return false;
            return this.guessesTokens.every(guess => {
                const expected = this.getRowColors(guess, word);
                const actual = this.getRowColors(guess);
                return expected.every((color, idx) => color === actual[idx]);
            });
        });

        const limit = 200;
        wordlister(this.langFolder, candidates, limit);
    }
}
