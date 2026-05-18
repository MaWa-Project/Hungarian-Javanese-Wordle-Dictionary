import { WordleEngine } from "./wordle-base.js";

export class JavaneseWordle extends WordleEngine {
    constructor() {
        super({
            langFolder: 'javanese',
            fileName: 'words_javanese.txt',
            diacriticMap: { 'é': 'e', 'è': 'e', 'å': 'a' }
        });
    }
}
window.JavaneseWordle = JavaneseWordle;
