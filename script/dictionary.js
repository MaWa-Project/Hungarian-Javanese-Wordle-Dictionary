import { wordlister } from "./wordlister.js";

async function loadDictionary() {
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get('lang');
    const otherLang = lang === 'hungarian' ? 'javanese' : 'hungarian';
    const listContainer = document.getElementById('word-list');
    
    if (!lang) {
        listContainer.textContent = "Language not specified.";
        return;
    }

    document.getElementById('dict-title').textContent = 
        "Dictionary - " + lang.charAt(0).toUpperCase() + lang.slice(1);

    try {
        const response = await fetch(`lemma/${lang}/words_${lang}.txt`);
        const text = await response.text();
        const words = text.split('\n').map(w => w.trim()).filter(w => w.length > 0);

        wordlister(lang, words);
    } catch (e) {
        listContainer.textContent = "Error loading word list.";
        console.error(e);
    }

    const langChanger = document.getElementById('language-changer');
    langChanger.innerHTML = `↔ ${otherLang.charAt(0).toUpperCase() + otherLang.slice(1)} Dictionary`;
    langChanger.onclick = () => {
        window.location.href = `dictionary.html?lang=${otherLang}`;
    };
}

loadDictionary();
