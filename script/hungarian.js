import { WordleEngine } from "./wordle-base.js";

export class HungarianWordle extends WordleEngine {
    constructor() {
        super({
            langFolder: 'hungarian',
            fileName: 'words_hungarian.txt',
            diacriticMap: { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ö': 'o', 'ő': 'o', 'ú': 'u', 'ü': 'u', 'ű': 'u' }
        });
        this.DIGRAPHS = ["dzs", "dz", "cs", "gy", "ly", "ny", "sz", "ty"];
    }

    tokenize(word) {
        let tokens = [], i = 0;
        while (i < word.length) {
            let found = this.DIGRAPHS.find(d => word.substring(i).startsWith(d));
            if (found) { tokens.push(found); i += found.length; }
            else { tokens.push(word[i]); i++; }
        }
        return tokens;
    }

    handleKey(e) {
        if (this.gameOver) return;
        if (e.key === 'Enter' && this.currentGuessTokens.length === this.wordLength) {
            const guessNorm = this.currentGuessTokens.map(t => this.normalizeToken(t)).join('');
            const targetNorm = this.targetWordNorm.join('');
            this.guessesTokens.push([...this.currentGuessTokens]);

            if ((guessNorm === targetNorm) || (this.guessesTokens.length === this.maxGuesses)) {
                this.gameOver = true;
            }

            this.currentGuessTokens = [];
            this.updatePossibleWords();
        } else if (e.key === 'Backspace') {
            this.currentGuessTokens.pop();
        } else if (/^[a-z|áéíóöőúüű]$/i.test(e.key) && this.currentGuessTokens.length <= this.wordLength) {
            let char = e.key.toLowerCase();
            let lastIdx = this.currentGuessTokens.length - 1;
            if (lastIdx >= 0) {
                let combo = this.currentGuessTokens[lastIdx] + char;
                if (this.DIGRAPHS.includes(combo) || (this.currentGuessTokens[lastIdx] === "dz" && char === "s")) {
                    this.currentGuessTokens[lastIdx] = combo;
                } else if (this.currentGuessTokens.length < this.wordLength) {
                    this.currentGuessTokens.push(char);
                }
            } else { this.currentGuessTokens.push(char); }
        }
        this.drawBoard();
    }
}
window.HungarianWordle = HungarianWordle;
