async function loadEntry() {
    const urlParams = new URLSearchParams(window.location.search);
    const word = urlParams.get('word');
    const lang = urlParams.get('lang');
    const container = document.getElementById('entry-container');

    document.getElementById('back-btn').onclick = () => {
        window.location.href = `dictionary.html?lang=${lang}`;
    };

    if (!word || !lang) {
        container.textContent = "Entry not found.";
        return;
    }

    try {
        const fileName = word.charAt(0).toUpperCase() + word.slice(1);
        const response = await fetch(`lemma/${lang}/${fileName}-TEI.xml`);
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

        renderTEI(xmlDoc, container);
    } catch (e) {
        container.innerHTML = `<p>Error loading entry for <b>${word}</b>. Ensure the XML file exists.</p>`;
        console.error(e);
    }
}

function renderTEI(xml, container) {
    container.innerHTML = "";

    // Create main card
    const article = document.createElement('article');
    article.className = "entry-card";

    // 1. HEADER SECTION
    const lemmaNode = xml.querySelector("form[type='lemma']");
    const header = document.createElement('header');
    header.className = "header";

    // Lemma title: word + script
    const h1 = document.createElement('h1');
    h1.className = "lemma";
    //first two orths are the main word and its script form, if available
    const orths = Array.from(lemmaNode.querySelectorAll("orth")).map(o => o.textContent).slice(0, 2);
    h1.textContent = orths.join(' ');
    header.appendChild(h1);

    // Pronunciation
    const pronP = document.createElement('p');
    pronP.className = "pron";
    const syll = xml.querySelector("syllabic")?.textContent || "";
    const ipa = (xml.querySelector("ipa")?.textContent || "").slice(7, -2);
    pronP.innerHTML = `${syll} <span class="ipa">[${ipa}]</span>`;
    header.appendChild(pronP);

    // POS and Inflection
    const posSpan = document.createElement('span');
    posSpan.className = "pos";
    const pos = xml.querySelector("pos")?.textContent || "";
    const plural = xml.querySelector("inflection orth")?.textContent || "";
    posSpan.textContent = `${pos}${plural ? ` (plural: ${plural})` : ""}`;
    header.appendChild(posSpan);

    article.appendChild(header);

    // 2. SENSE BLOCKS
    const senses = xml.querySelectorAll("sense");
    senses.forEach(sense => {
        const section = document.createElement('section');
        section.className = "sense-block";

        const regSpan = document.createElement('span');
        regSpan.className = "register";
        regSpan.textContent = sense.querySelector("usg")?.textContent || "";
        section.appendChild(regSpan);

        const orthDiv = document.createElement('div');
        orthDiv.className = "orth";
        const transOrths = Array.from(sense.querySelectorAll("cit orth")).map(o => o.textContent);
        // Formats as: "manuk (ꦩꦤꦸꦏ꧀)"
        orthDiv.textContent = transOrths.length > 1 
            ? `${transOrths[0]} (${transOrths[1]})` 
            : transOrths[0];
        section.appendChild(orthDiv);

        article.appendChild(section);
    });

    // 3. DEFINITION SECTION
    const defSegs = Array.from(xml.querySelectorAll("def p seg"));
    if (defSegs.length > 0) {
        const defSection = document.createElement('section');
        defSection.className = "definition";
        // Assuming first seg is the primary definition (italicized) and others follow
        let defHTML = `<strong>Definition:</strong> <br> <em>${defSegs[0].textContent}</em>`;
        for (let i = 1; i < defSegs.length; i++) {
            defHTML += `<br> ${defSegs[i].textContent}`;
        }
        defSection.innerHTML = `<p>${defHTML}</p>`;
        article.appendChild(defSection);
    }

    // 4. EXAMPLES SECTION
    const exampleNode = xml.querySelector("cit[type='example']");
    if (exampleNode) {
        const exSection = document.createElement('section');
        exSection.className = "cit-example";

        const quotes = Array.from(exampleNode.querySelectorAll("quote"));
        
        // Group quotes by language
        const huQuotes = quotes.filter(q => q.getAttribute("xml:lang") === "Hu");
        const jvQuotes = quotes.filter(q => q.getAttribute("xml:lang") === "Jv");

        if (huQuotes.length > 0) {
            const div = document.createElement('div');
            div.className = "quote lang-hu";
            div.innerHTML = `<strong>Magyar:</strong> <br> ${huQuotes.map(q => q.textContent).join(' <br> ')}`;
            exSection.appendChild(div);
        }

        if (jvQuotes.length > 0) {
            const div = document.createElement('div');
            div.className = "quote lang-jv";
            div.innerHTML = `<strong>Jawa:</strong> <br> ${jvQuotes.map(q => q.textContent).join(' <br> ')}`;
            exSection.appendChild(div);
        }

        article.appendChild(exSection);
    }

    // 5. FOOTER NOTES
    const footer = document.createElement('footer');
    footer.className = "notes";

    const noteTypes = [
        { selector: "note[type='synonyms']", title: "Synonym" },
        { selector: "note[type='compounds']", title: "Compound" },
        { selector: "note[type='crossReference']", title: "Reference", isRef: true }
    ];

    noteTypes.forEach(type => {
        const node = xml.querySelector(type.selector);
        if (node) {
            const p = document.createElement('p');
            const items = Array.from(node.querySelectorAll(type.isRef ? "ref orth" : "item orth"))
                              .map(o => o.textContent);
            
            let content = items.length > 1 ? `${items[0]} (${items[1]})` : items[0];
            p.innerHTML = `<span class="note-title">${type.title}:</span> ${type.isRef ? "→ " : ""}${content}`;
            footer.appendChild(p);
        }
    });

    article.appendChild(footer);
    container.appendChild(article);
}

loadEntry();
