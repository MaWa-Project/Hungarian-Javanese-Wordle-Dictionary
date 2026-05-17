import { WordleEngine } from "./wordle-base.js";

export class JavaneseWordle extends WordleEngine {
    constructor() {
        super({
            langFolder: 'javanese',
            fileName: 'words_javanese.txt',
            diacriticMap: { 'é': 'e', 'è': 'e', 'å': 'a' }
        });
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
        } else if (/^[a-z\u00C0-\u017F]$/i.test(e.key)) {
            e.preventDefault();
            if (this.currentGuessTokens.length < this.wordLength) {
                this.currentGuessTokens.push(e.key.toLowerCase());
            }
        }
        // redraw the board after processing input
        this.drawBoard();
    }
}
window.JavaneseWordle = JavaneseWordle;
