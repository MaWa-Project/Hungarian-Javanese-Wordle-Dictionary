async function loadDictionary() {
    const urlParams = new URLSearchParams(window.location.search);
    const lang = urlParams.get('lang');
    const listContainer = document.getElementById('word-list');
    
    if (!lang) {
        listContainer.textContent = "Language not specified.";
        return;
    }

    document.getElementById('dict-title').textContent = 
        lang.charAt(0).toUpperCase() + lang.slice(1) + " Dictionary";

    try {
        const response = await fetch(`lemma/${lang}/words_${lang}.txt`);
        const text = await response.text();
        const words = text.split('\n').map(w => w.trim()).filter(w => w.length > 0);

        listContainer.innerHTML = "";
        const ul = document.createElement('ul');

        words.forEach(word => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            
            a.href = `entry.html?word=${encodeURIComponent(word)}&lang=${lang}`;
            a.textContent = word;
            li.appendChild(a);
            ul.appendChild(li);
        });

        listContainer.appendChild(ul);
    } catch (e) {
        listContainer.textContent = "Error loading word list.";
        console.error(e);
    }

    const langChanger = document.getElementById('language-changer');
    const otherLang = lang === 'hungarian' ? 'javanese' : 'hungarian';
    langChanger.innerHTML = `↔ ${otherLang.charAt(0).toUpperCase() + otherLang.slice(1)} Dictionary`;
    langChanger.onclick = () => {
        window.location.href = `dictionary.html?lang=${otherLang}`;
    };
}

loadDictionary();
