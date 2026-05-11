class WordleSolver {
    constructor() {
        const urlParams = new URLSearchParams(window.location.search);
        this.lang = urlParams.get('lang') || 'hungarian';
        
        this.engine = (this.lang === 'hungarian') ? new HungarianWordle() : new JavaneseWordle();
        
        this.grid = Array.from({ length: 6 }, () => ({
            tokens: [],
            colors: Array(5).fill("initial") 
        }));
        
        this.activeRow = 0;
        this.colorCycle = ["#3a3a3c", "#6aaa64", "#4a7a44", "#c9b458", "#91823f"];
        
        document.getElementById('solver-title').textContent = 
            (this.lang === 'hungarian' ? "Magyar" : "Jawa") + " Wordle Solver";
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
        const board = document.getElementById('solver-board');
        board.innerHTML = "";

        this.grid.forEach((row, rIdx) => {
            const rowEl = document.createElement('div');
            rowEl.className = "solver-row";
            rowEl.style.display = "flex";
            rowEl.style.gap = "5px";
            rowEl.style.marginBottom = "5px";

            for (let tIdx = 0; tIdx < this.engine.wordLength; tIdx++) {
                const box = document.createElement('div');
                box.className = "solver-box";
                const token = row.tokens[tIdx] || "";
                
                box.textContent = token;
                box.style.width = this.engine.boxWidth;
                box.style.height = "45px";
                box.style.lineHeight = "45px";
                box.style.textAlign = "center";
                box.style.border = "2px solid #3a3a3c";
                box.style.fontWeight = "bold";
                box.style.fontSize = "1.5rem";
                box.style.textTransform = "uppercase";
                box.style.cursor = "pointer";

                if (token) {
                    box.style.color = "white";
                    if (row.colors[tIdx] === "initial") {
                        box.style.backgroundColor = "#3a3a3c"; 
                        box.style.borderColor = "#565758";
                    } else {
                        box.style.backgroundColor = row.colors[tIdx];
                        box.style.borderColor = "transparent";
                    }
                } else {
                    box.style.backgroundColor = "#121213"; 
                    box.style.color = "black";
                }

                if (rIdx === this.activeRow) {
                    box.style.borderColor = "#818384";
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
        const listContainer = document.getElementById('possible-words');
        
        const candidates = this.engine.allWords.filter(word => {
            const wordTokens = this.engine.tokenize(word);
            if (wordTokens.length !== this.engine.wordLength) return false;

            for (let r = 0; r < this.grid.length; r++) {
                const row = this.grid[r];
                if (row.tokens.length === 0) continue;

                const expectedColors = this.engine.getRowColors(row.tokens, word);

                for (let t = 0; t < row.tokens.length; t++) {
                    const currentColor = row.colors[t];
                    const logicColor = (currentColor === "initial" || currentColor === "#3a3a3c") 
                        ? "grey" 
                        : currentColor;

                    if (expectedColors[t] !== logicColor) return false;
                }
            }
            return true;
        });

        let html = `<strong>Matches Found: ${candidates.length}</strong><ul>`;
        candidates.slice(0, 200).forEach(word => {
            html += `<li><a href="entry.html?word=${encodeURIComponent(word)}&lang=${this.lang}">${word}</a></li>`;
        });
        html += "</ul>";
        if (candidates.length > 200) html += `<p>...and ${candidates.length - 200} more.</p>`;
        listContainer.innerHTML = html;
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
