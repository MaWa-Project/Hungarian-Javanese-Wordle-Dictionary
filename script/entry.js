import { capitalize } from "./capitalizer.js";

async function loadEntry() {
    const urlParams = new URLSearchParams(window.location.search);
    const word = urlParams.get('word');
    const lang = urlParams.get('lang');
    const container = document.getElementById('entry-container');

    if (!word || !lang) {
        container.textContent = "Entry not found.";
        return;
    }

    document.getElementById('back-btn').onclick = () => {
        window.location.href = `dictionary.html?lang=${lang}`;
    };

    try {
        const fileName = capitalize(word) + "-TEI.xml";
        const response = await fetch(`lemma/${lang}/${fileName}`);
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

    const article = document.createElement('article');
    article.className = "content-card";

    // 1. build and append Header Section
    article.appendChild(createHeaderSection(xml));

    // 2. build and append Sense Blocks
    const senseSections = createSenseSections(xml);
    senseSections.forEach(section => article.appendChild(section));

    // 3. build and append Definition Section
    const defSection = createDefinitionSection(xml);
    if (defSection) article.appendChild(defSection);

    // 4. build and append Examples Section
    const exSection = createExamplesSection(xml);
    if (exSection) article.appendChild(exSection);

    // 5. build and append Footer Notes Section
    article.appendChild(createFooterNotes(xml));

    container.appendChild(article);
}

// 1. parses Lemma title details, IPA, and structural part of speech rules
function createHeaderSection(xml) {
    const lemmaNode = xml.querySelector("form[type='lemma']");
    const header = document.createElement('header');
    header.className = "header";

    // lemma title: main word + alternate script form
    const h1 = document.createElement('h1');
    h1.className = "lemma";
    const orths = Array.from(lemmaNode.querySelectorAll("orth")).map(o => o.textContent).slice(0, 2);
    h1.textContent = orths.join(' ');
    header.appendChild(h1);

    // pronunciation syllabic extraction + custom notation slices
    const pronP = document.createElement('p');
    pronP.className = "pron";
    const syll = xml.querySelector("syllabic")?.textContent || "";
    const ipa = (xml.querySelector("ipa")?.textContent || "").slice(7, -2);
    pronP.innerHTML = `${syll} <span class="ipa">[${ipa}]</span>`;
    header.appendChild(pronP);

    // Part of Speech and associated Inflections
    const posSpan = document.createElement('span');
    posSpan.className = "pos";
    const pos = xml.querySelector("pos")?.textContent || "";
    const plural = xml.querySelector("inflection orth")?.textContent || "";
    posSpan.textContent = `${pos}${plural ? ` (plural: ${plural})` : ""}`;
    header.appendChild(posSpan);

    return header;
}

// 2. processes multiple translation registers into unified blocks
function createSenseSections(xml) {
    const sections = [];
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
        
        orthDiv.textContent = transOrths.length > 1 
            ? `${transOrths[0]} (${transOrths[1]})` 
            : transOrths[0];
        section.appendChild(orthDiv);

        sections.push(section);
    });

    return sections;
}

// 3. handles multilingual text segmentation for definitions
function createDefinitionSection(xml) {
    const defSegs = Array.from(xml.querySelectorAll("def p seg"));
    if (defSegs.length === 0) return null;

    const defSection = document.createElement('section');
    defSection.className = "definition";
    
    let defHTML = `<strong>Definition:</strong> <br> <em>${defSegs[0].textContent}</em>`;
    for (let i = 1; i < defSegs.length; i++) {
        defHTML += `<br> ${defSegs[i].textContent}`;
    }
    defSection.innerHTML = `<p>${defHTML}</p>`;
    
    return defSection;
}

// 4. Groups contextual quotes separately by language properties
function createExamplesSection(xml) {
    const exampleNode = xml.querySelector("cit[type='example']");
    if (!exampleNode) return null;

    const exSection = document.createElement('section');
    exSection.className = "cit-example";

    const quotes = Array.from(exampleNode.querySelectorAll("quote"));
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

    return exSection;
}

// 5. Generates metadata, synonyms, compounds, and directional references
function createFooterNotes(xml) {
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

    return footer;
}

loadEntry();
