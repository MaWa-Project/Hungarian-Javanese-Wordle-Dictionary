class JavaneseWordle extends WordleEngine {
    constructor() {
        super({
            langFolder: 'javanese',
            fileName: 'words_javanese.txt',
            boxWidth: "40px",
            diacriticMap: { 'é': 'e', 'è': 'e', 'å': 'a' }
        });
    }

    handleKey(e) {
        if (this.gameOver) return;
        if (e.key === 'Enter' && this.currentGuessTokens.length === this.wordLength) {
            const guess = this.currentGuessTokens.join('');
            this.guessesTokens.push([...this.currentGuessTokens]);

            if (this.normalizeToken(guess) === this.normalizeToken(this.targetWordLiteral)) {
                const link = `<a href="entry.html?word=${encodeURIComponent(this.targetWordLiteral)}&lang=${this.langFolder}">${this.targetWordLiteral}</a>`;
                document.getElementById('message').innerHTML = `Victory! The word is: <strong>${link}</strong>`;
                this.gameOver = true;
            } else if (this.guessesTokens.length === this.maxGuesses) {
                const link = `<a href="entry.html?word=${encodeURIComponent(this.targetWordLiteral)}&lang=${this.langFolder}">${this.targetWordLiteral}</a>`;
                document.getElementById('message').innerHTML = `Game Over. The word was: <strong>${link}</strong>`;
                this.gameOver = true;
            }
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
