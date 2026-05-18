import { WordleEngine } from "./wordle-base.js";

export class HungarianWordle extends WordleEngine {
    constructor() {
        super({
            langFolder: 'hungarian',
            fileName: 'words_hungarian.txt',
            diacriticMap: { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ö': 'o', 'ő': 'o', 'ú': 'u', 'ü': 'u', 'ű': 'u' }
        });
        this.DIGRAPHS = ["dzs", "dz", "cs", "gy", "ly", "ny", "sz", "ty"];
    }

    // (override) Hungarian tokenization that recognizes digraphs and trigraphs
    tokenize(word) {
        let tokens = [], i = 0;
        while (i < word.length) {
            let found = this.DIGRAPHS.find(d => word.substring(i).startsWith(d));
            if (found) { tokens.push(found); i += found.length; }
            else { tokens.push(word[i]); i++; }
        }
        return tokens;
    }

    // (override) handle Hungarian digraphs and trigraphs when appending characters
    appendChar(char) {
        let lastTokenInd = this.currentGuessTokens.length - 1;
        let combo = this.currentGuessTokens[lastTokenInd] + char;
        // if the last token and the new char form a valid digraph/trigraph, replace the last token with the combo
        if (this.DIGRAPHS.includes(combo) || (this.currentGuessTokens[lastTokenInd] === "dz" && char === "s")) {
            this.currentGuessTokens[lastTokenInd] = combo;
        }
        // if not, append the char as a new token (if we haven't reached the word length limit)
        else if (this.currentGuessTokens.length < this.wordLength) {
            this.currentGuessTokens.push(char);
        }
    }
}
window.HungarianWordle = HungarianWordle;
