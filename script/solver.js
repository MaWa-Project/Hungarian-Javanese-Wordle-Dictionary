import { capitalize } from "./capitalizer.js";
import { HungarianWordle } from "./hungarian.js";
import { JavaneseWordle } from "./javanese.js";

export class WordleSolver {
    constructor() {
        const urlParams = new URLSearchParams(window.location.search);
        this.lang = urlParams.get('lang') || 'hungarian';
        
        this.engine = (this.lang === 'hungarian') ?
        new HungarianWordle() :
        new JavaneseWordle();
        this.engine.isSolverMode = true;
        this.engine.onBoxClick = (r, t) => this.toggleColor(r, t);  // clicking changes the color of the guess box
        this.colorCycle = ["gray", "green", "dark-green", "yellow", "dark-yellow"]; // cycle of colors of the grid
        
        // set the page title based on the language
        document.getElementById('solver-title').textContent = 
             "Solver - " + capitalize(this.lang);

        // set up the reset button
        const resetBtn = document.getElementById('reset-solver-btn');
        if (resetBtn) {
            resetBtn.onclick = () => this.resetSolver();
        }

        // add solver info to the page
        this.engine.addWordleInfo(true);
    }

    // initializes the game and renders the initial state
    async init() {
        await this.engine.initGame();
        this.render();
    }

    // resets the solver state and re-renders the board
    resetSolver() {
        this.engine.resetGame();
        this.render();
    }

    // toggles the color of a specific box in the guess board
    toggleColor(rIdx, tIdx) {
        const currentColor = this.engine.guessesColors[rIdx][tIdx];
        let nextIdx = (currentColor === "initial" || currentColor === "gray") 
            ? 1 
            : (this.colorCycle.indexOf(currentColor) + 1) % this.colorCycle.length;
        
        this.engine.guessesColors[rIdx][tIdx] = this.colorCycle[nextIdx];
        this.render();
    }

    // sets up the guess board and language switcher, updates possible words 
    render() {
        this.engine.drawBoard();
        this.engine.updatePossibleWords();

        // set up the language switcher button
        const langChanger = document.getElementById('language-changer');
        if (langChanger) {
            const otherLang = this.lang === 'hungarian' ? 'javanese' : 'hungarian';
            langChanger.innerHTML = `↔ ${capitalize(otherLang)} Solver`;
            langChanger.onclick = () => {
                window.location.href = `solver.html?lang=${otherLang}`;
            };
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const solver = new WordleSolver();
    window.addEventListener('keydown', (e) => {
        if (e.key === "Backspace") e.preventDefault();
        solver.engine.handleKey(e);
        solver.render();
    });
    solver.init();
});
