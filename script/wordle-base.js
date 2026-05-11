class WordleEngine {
    constructor(config) {
        this.wordLength = 5;
        this.maxGuesses = 6;
        this.diacriticMap = config.diacriticMap || {};
        this.langFolder = config.langFolder;
        this.fileName = config.fileName;
        this.boxWidth = config.boxWidth || "40px";
        
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
        document.getElementById('message').textContent = "";
        this.drawBoard();
        this.updatePossibleWords();
    }

    getRowColors(guessTokens, targetLiteralOverride = null) {
        const colors = Array(this.wordLength).fill("grey");
        const tTokens = targetLiteralOverride ? this.tokenize(targetLiteralOverride) : this.targetWordTokens;
        const tNorm = tTokens.map(t => this.normalizeToken(t));
        const availableNorm = [...tNorm];
        const gNorm = guessTokens.map(t => this.normalizeToken(t));

        for (let i = 0; i < this.wordLength; i++) {
            if (gNorm[i] === tNorm[i]) {
                colors[i] = (guessTokens[i] === tTokens[i]) ? "#6aaa64" : "#4a7a44"; 
                availableNorm[i] = null; 
            }
        }

        for (let i = 0; i < this.wordLength; i++) {
            if (!colors[i].startsWith("#")) { 
                const idx = availableNorm.indexOf(gNorm[i]);
                if (idx !== -1) {
                    const literalExists = tTokens.some((t, tIdx) => availableNorm[tIdx] !== null && t === guessTokens[i]);
                    colors[i] = literalExists ? "#c9b458" : "#91823f";
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
            const guess = this.guessesTokens[i];
            const colors = guess ? this.getRowColors(guess) : [];

            for (let j = 0; j < this.wordLength; j++) {
                const box = document.createElement('span');
                box.className = "wordle-box";
                Object.assign(box.style, {
                    border: "1px solid black", display: "inline-block", textAlign: "center",
                    lineHeight: "40px", margin: "2px", height: "40px",
                    width: this.boxWidth, color: guess ? "white" : "black"
                });

                if (guess) {
                    box.textContent = guess[j];
                    box.style.backgroundColor = colors[j];
                } else if (i === this.guessesTokens.length && this.currentGuessTokens[j]) {
                    box.textContent = this.currentGuessTokens[j];
                }
                row.appendChild(box);
            }
            board.appendChild(row);
        }
    }

    updatePossibleWords() {
        const listContainer = document.getElementById('possible-words');
        
        const candidates = this.allWords.filter(word => {
            const wordTokens = this.tokenize(word);
            if (wordTokens.length !== this.wordLength) return false;
            return this.guessesTokens.every(guess => {
                const expected = this.getRowColors(guess, word);
                const actual = this.getRowColors(guess);
                return expected.every((color, idx) => color === actual[idx]);
            });
        });

    if (candidates.length === 0) { 
        listContainer.innerHTML = "<p>No words found.</p>"; 
        return; 
    }

    let html = `<strong>Words found: ${candidates.length}</strong><ul>`;
    const limit = 200;
    
    candidates.slice(0, limit).forEach(word => {
        html += `<li><a href="entry.html?word=${encodeURIComponent(word)}&lang=${this.langFolder}">${word}</a></li>`;
    });
    
    html += "</ul>";
    if (candidates.length > limit) html += `<p><em>...and ${candidates.length - limit} more.</em></p>`;
    listContainer.innerHTML = html;
    }
}
