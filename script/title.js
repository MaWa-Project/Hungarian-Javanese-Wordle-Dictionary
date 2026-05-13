function wordle_title_maker() {
    const colors = ["gray", "green", "yellow"];
    const randomColors = Array.from({length: 6}, () => colors[Math.floor(Math.random() * colors.length)]);
    
    return `<div class="title-container">
        <span class="wordle ${randomColors[0]}">W</span>
        <span class="wordle ${randomColors[1]}">o</span>
        <span class="wordle ${randomColors[2]}">r</span>
        <span class="wordle ${randomColors[3]}">d</span>
        <span class="wordle ${randomColors[4]}">l</span>
        <span class="wordle ${randomColors[5]}">e</span>
    </div>`;
};

document.addEventListener("DOMContentLoaded", () => {
    const titleElement = document.getElementById('wordle-title');
    if (titleElement) {
        titleElement.innerHTML = wordle_title_maker();
    }
});
