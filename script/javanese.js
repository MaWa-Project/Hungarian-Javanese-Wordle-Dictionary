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
        if (this.gameOver) return;
        if (e.key === 'Enter' && this.currentGuessTokens.length === this.wordLength) {
            const guess = this.currentGuessTokens.join('');
            this.guessesTokens.push([...this.currentGuessTokens]);
            this.currentGuessTokens = [];
            this.updatePossibleWords();
        } else if (e.key === 'Backspace') {
            this.currentGuessTokens.pop();
        } else if (/^[a-z\u00C0-\u017F]$/i.test(e.key) && this.currentGuessTokens.length < this.wordLength) {
            this.currentGuessTokens.push(e.key.toLowerCase());
        }
        this.drawBoard();
    }
}
window.JavaneseWordle = JavaneseWordle;
