import { wordlister } from "./wordlister.js";
import { capitalize } from "./capitalizer.js";

async function loadDictionary() {
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get('lang');
    const otherLang = lang === 'hungarian' ? 'javanese' : 'hungarian';
    const listContainer = document.getElementById('word-list');
    
    // basic error handling for missing container or language parameter
    if (!listContainer) {
        console.error("Word list container not found.");
        return;
    }
    if (!lang) {
        listContainer.textContent = "Language not specified.";
        return;
    }

    // set the page title based on the language
    document.getElementById('dict-title').textContent = 
        "Dictionary - " + capitalize(lang);

    // load the word list for the specified language
    try {
        const response = await fetch(`lemma/${lang}/words_${lang}.txt`);
        const text = await response.text();
        const words = text.split('\n').map(w => w.trim()).filter(w => w.length > 0);

        wordlister(lang, words);
    } catch (e) {
        listContainer.textContent = "Error loading word list.";
        console.error(e);
    }

    // set up the language switcher button
    const langChanger = document.getElementById('language-changer');
    if (langChanger) {
        langChanger.innerHTML = `↔ ${capitalize(otherLang)} Dictionary`;
        langChanger.onclick = () => {
            window.location.href = `dictionary.html?lang=${otherLang}`;
        };
    }
}

loadDictionary();
