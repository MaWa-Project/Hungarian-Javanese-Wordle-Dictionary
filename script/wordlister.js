export function wordlister(lang = "", words = [], limit = 0) {
    const wordList = document.getElementById("word-list");
    wordList.innerHTML = "";

    if (words.length === 0) {
        wordList.textContent = "No possible words found.";
        return;
    };

    if (limit > 0 && words.length > limit) {
        const info = document.createElement("p");
        info.innerHTML = `Showing ${Math.min(limit, words.length)} of ${words.length} words.`;
        wordList.appendChild(info);
        words = words.slice(0, limit);
    }

    const dictionary = {};
    words.forEach(word => {
        const initial = word[0];
        if (!dictionary[initial]) {
            dictionary[initial] = [];
        }
        dictionary[initial].push(word);
    });

    const dictionaryInitials = Object.keys(dictionary);

    dictionaryInitials.forEach(initial => {
        const initialHeader = document.createElement("h2");
        initialHeader.textContent = initial.toUpperCase();
        wordList.appendChild(initialHeader);

        const ul = document.createElement("ul");
        ul.className = "possible-words";
        dictionary[initial].forEach(word => {
            const li = document.createElement("li");
            li.className = "possible-word-item";
            const a = document.createElement("a");
            a.href = `entry.html?word=${encodeURIComponent(word)}&lang=${lang}`;
            a.textContent = word;
            li.appendChild(a);
            ul.appendChild(li);
        });
        wordList.appendChild(ul);
    });
}
