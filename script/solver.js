import { wordlister } from "./wordlister.js";
import { HungarianWordle } from "./hungarian.js";
import { JavaneseWordle } from "./javanese.js";
import { WordleEngine } from "./wordle-base.js";

export class WordleSolver {
    constructor() {
        const urlParams = new URLSearchParams(window.location.search);
        this.lang = urlParams.get('lang') || 'hungarian';
        
        this.engine = (this.lang === 'hungarian') ? new HungarianWordle() : new JavaneseWordle();
        
        this.grid = Array.from({ length: 6 }, () => ({
            tokens: [],
            colors: Array(5).fill("initial") 
        }));
        
        this.activeRow = 0;
        this.colorCycle = ["gray", "green", "dark-green", "yellow", "dark-yellow"];
        
        document.getElementById('solver-title').textContent = 
             "Solver - " + (this.lang === 'hungarian' ? "Hungarian" : "Javanese");

        this.engine.addWordleInfo(true);
    }

    resetSolver() {
        this.grid = Array.from({ length: 6 }, () => ({
            tokens: [],
            colors: Array(5).fill("initial") 
        }));
        this.activeRow = 0;
        this.render();
    }

    async init() {
        await this.engine.initGame();
        this.render();
    }

    processCharacter(char) {
        let currentRow = this.grid[this.activeRow];
        
        if (this.lang === 'hungarian') {
            let lastIdx = currentRow.tokens.length - 1;
            if (lastIdx >= 0) {
                let combo = currentRow.tokens[lastIdx] + char;
                if (this.engine.DIGRAPHS.includes(combo) || (currentRow.tokens[lastIdx] === "dz" && char === "s")) {
                    currentRow.tokens[lastIdx] = combo;
                    this.checkAutoAdvance();
                    return;
                }
            }
        }

        if (currentRow.tokens.length < this.engine.wordLength) {
            currentRow.tokens.push(char);
        }

        this.checkAutoAdvance();
    }

    checkAutoAdvance() {
        if (this.grid[this.activeRow].tokens.length === this.engine.wordLength && this.activeRow < 5) {
            this.activeRow++;
        }
    }

    handleInput(e) {
        if (e.key === 'Backspace') {
            let currentRow = this.grid[this.activeRow];
            if (currentRow.tokens.length > 0) {
                currentRow.tokens.pop();
            } else if (this.activeRow > 0) {
                this.activeRow--;
                this.grid[this.activeRow].tokens.pop();
            }
        } 
        else if (/^[a-záéíóöőúüűéèå]$/i.test(e.key)) {
            this.processCharacter(e.key.toLowerCase());
        }
        this.render();
    }

    toggleColor(rIdx, tIdx) {
        if (!this.grid[rIdx].tokens[tIdx]) return;
        
        const currentRow = this.grid[rIdx];
        const currentColor = currentRow.colors[tIdx];

        let nextIdx = (currentColor === "initial" || currentColor === "#3a3a3c") 
            ? 1 
            : (this.colorCycle.indexOf(currentColor) + 1) % this.colorCycle.length;
        
        currentRow.colors[tIdx] = this.colorCycle[nextIdx];
        this.render();
    }

    render() {
        const board = document.getElementById('game-board');
        board.innerHTML = "";

        this.grid.forEach((row, rIdx) => {
            const rowEl = document.createElement('div');
            rowEl.className = "game-row";

            for (let tIdx = 0; tIdx < this.engine.wordLength; tIdx++) {
                const box = document.createElement('span');
                const token = row.tokens[tIdx] || "";
                
                box.textContent = token;

                if (token) {
                    box.className = "game-box white-text";
                    if (row.colors[tIdx] === "initial") {
                        box.className = "game-box white-text gray";
                    } else {
                        box.className = "game-box white-text " + row.colors[tIdx];
                    }
                } else {
                    box.className = "game-box";
                }

                box.onclick = () => this.toggleColor(rIdx, tIdx);
                rowEl.appendChild(box);
            }
            board.appendChild(rowEl);
        });

        this.updateSuggestions();

        const langChanger = document.getElementById('language-changer');
        const otherLang = this.lang === 'hungarian' ? 'javanese' : 'hungarian';
        langChanger.innerHTML = `↔ ${otherLang.charAt(0).toUpperCase() + otherLang.slice(1)} Solver`;
        langChanger.onclick = () => {
            window.location.href = `solver.html?lang=${otherLang}`;
        };
    }

    updateSuggestions() {
        const candidates = this.engine.allWords.filter(word => {
            const wordTokens = this.engine.tokenize(word);
            if (wordTokens.length !== this.engine.wordLength) return false;

            for (let r = 0; r < this.grid.length; r++) {
                const row = this.grid[r];
                if (row.tokens.length === 0) continue;

                const expectedColors = this.engine.getRowColors(row.tokens, wordTokens);

                for (let t = 0; t < row.tokens.length; t++) {
                    const currentColor = row.colors[t];
                    const logicColor = (currentColor === "initial" || currentColor === "gray") 
                        ? "gray" 
                        : currentColor;

                    if (expectedColors[t] !== logicColor) return false;
                }
            }
            return true;
        });

        const limit = 200;
        wordlister(this.lang, candidates, limit);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const solver = new WordleSolver();
    window.addEventListener('keydown', (e) => {
        if (e.key === "Backspace") e.preventDefault();
        solver.handleInput(e);
    });
    solver.init();
});
