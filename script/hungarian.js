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

    // Hungarian tokenization that recognizes digraphs and trigraphs
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
        // prevent input if game is over
        if (this.gameOver) return;
        // if Enter is pressed and current guess has 5 tokens, process the guess
        if (e.key === 'Enter') {
            if (this.currentGuessTokens.length === this.wordLength) {
                e.preventDefault();
                const guessNorm = this.currentGuessTokens.map(t => this.normalizeToken(t)).join('');
                const targetNorm = this.targetWordNorm.join('');
                this.guessesTokens.push([...this.currentGuessTokens]);

                // check if the guess is correct or if max guesses reached to end the game
                if ((guessNorm === targetNorm) || (this.guessesTokens.length === this.maxGuesses)) {
                    this.gameOver = true;
                }

                this.currentGuessTokens = [];
                this.updatePossibleWords();
            }
        // if Backspace is pressed, remove the last token from the current guess
        } else if (e.key === 'Backspace') {
            e.preventDefault();
            this.currentGuessTokens.pop();
        // if a valid character is pressed, add it to the current guess (if less than 5 tokens)
        } else if (/^[a-z|áéíóöőúüű]$/i.test(e.key) && this.currentGuessTokens.length <= this.wordLength) {
            e.preventDefault();
            let char = e.key.toLowerCase();
            let lastIdx = this.currentGuessTokens.length - 1;
            // check for possible digraph/trigraph combinations with the last token
            if (lastIdx >= 0) {
                let combo = this.currentGuessTokens[lastIdx] + char;
                if (this.DIGRAPHS.includes(combo) || (this.currentGuessTokens[lastIdx] === "dz" && char === "s")) {
                    this.currentGuessTokens[lastIdx] = combo;
                } else if (this.currentGuessTokens.length < this.wordLength) {
                    this.currentGuessTokens.push(char);
                }
            } else { this.currentGuessTokens.push(char); }
        }
        // redraw the board after processing input
        this.drawBoard();
    }
}
window.HungarianWordle = HungarianWordle;
