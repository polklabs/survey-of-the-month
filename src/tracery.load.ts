import fs from 'fs';
import json_minify from 'node-json-minify';
import { generateGrammarHTML } from './data.html';
import { regexVariable, reservedKeys } from './tracery.const';

export const grammar: { [key: string]: string[] } = {};
export const grammarKeys: string[] = [];
let tags: string[] = [];

const loadedfiles: string[] = [];

loadGrammar('survey.jsonc');
checkGrammar();
checkTags();

generateGrammarHTML();

// Load multiple grammar files and merge them
function loadGrammar(filename: string) {
    loadedfiles.push(filename);

    const grammarTemp = JSON.parse(json_minify(fs.readFileSync(`./data/${filename}`,
        { encoding: 'utf8', flag: 'r' })));

    Object.keys(grammarTemp).forEach(key => {
        if (grammar[key] === undefined) {
            grammar[key] = grammarTemp[key];
        } else {
            // Duplicate key warning
            console.warn(`Key already exists in grammar: ${key}`);
            grammar[key].concat(grammarTemp[key]);
        }
    });

    if (grammarTemp['require!'] !== undefined) {
        grammarTemp['require!'].forEach((file: string) => {
            if (loadedfiles.findIndex(x => x === file) === -1) {
                loadGrammar(file);
            }
        })
    }

    grammarKeys.push(...Object.keys(grammar).filter(x => {
        if (x.includes('!')) { return false; }
        if (x.includes('origin')) { return false; }
        if (x.includes('intro_question')) { return false; }
        if (x.includes('close_question')) { return false; }
        if (x.includes('question')) { return false; }
        return true;
    }));
}

function checkGrammar() {
    const keys: string[] = Object.keys(grammar);

    // Check for duplicate values
    keys.forEach(key => {
        grammar[key].forEach((value: string, index: number) => {
            const dupIndex = grammar[key].findIndex((x: string) => x === value);
            if (!key.startsWith('_') && dupIndex < index && dupIndex >= 0) {
                console.warn(`Duplicate value: "${key}"": "${value}" (${index})`);
            }

            if (value.includes(' a #')) {
                console.warn(`Use modified instead for a/an: ${key}:${index} (${value.substr(0, 20)})`);
            }
        });
    });

    // Check for reserved keys
    keys.forEach(key => {
        if (reservedKeys.includes(key)) {
            console.error(`Cannot use reserved key: "${key}":[...]`);
        }
    });

    ['question', 'intro_question', 'close_question'].forEach(key => {
        grammar[key].forEach((value: string, index: number) => {
            let foundType = false;
            let m;
            while ((m = regexVariable.exec(value)) !== null) {
                // This is necessary to avoid infinite loops with zero-width matches
                if (m.index === regexVariable.lastIndex) {
                    regexVariable.lastIndex++;
                }
                const filterKey: string = m.groups['key'] ?? '';
                // Filter out tags
                if (filterKey === 'type') {
                    foundType = true;
                }
            }
            if (!foundType) {
                console.error(`${key}:${index} does not specify type.`);
            }
        });
    });
}

function checkTags() {
    const keys: string[] = Object.keys(grammar);
    const tmpTags: Set<string> = new Set();

    keys.forEach(key => {
        grammar[key].forEach((str: string, index: number) => {

            let m;
            const r = new RegExp(regexVariable);
            while ((m = r.exec(str)) !== null) {
                if (m.index === r.lastIndex) {
                    r.lastIndex++;
                }

                const key = m.groups?.['key'] ?? '';
                if (key === 'tag') {
                    const value = m.groups?.['value'] ?? '';
                    value.split(',').forEach((x: string) => tmpTags.add(x));
                }
            }

        });
    });

    tags = Array.from(tmpTags);
}

export function getTags(): string[] {
    return tags;
}