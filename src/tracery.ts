import { setSeed, randomNext } from './tracery.math';
import { ModString } from './tracery.mod';
import { AnswerType, Question } from '../app/src/app/shared/model/question.model';

import fs from 'fs';
import { generateGrammarHTML } from './data.html';

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const reservedKeys = ['type', 'key', 'count', 'other', 'tag']; // Used for question formatting, do not use as keys in grammar - #key#

export const regexVariable = /\[(?<key>[a-zA-Z0-9_]+):(?<value>.+?)\]/gm; // [key:value] -> key, value
export const regexString = /(#(?<key>([a-zA-Z0-9_]+|[*]))\.?(?<mod>[a-zA-Z0-9_.]*?)#)/gm; // #key#, #key.s#, #*#
export const regexInlineChoiceGroup = /\^\$(?<choices>.+?)(?<=[^\\])\$/gm; // ^$first:second$ -> first:second
export const regexInlineChoices = /(?<=[^\\]|^):/gm; // first:second -> ["first", "second"]

export const grammar: { [key: string]: string[] } = {};
const grammarKeys: string[] = [];
let tags: string[] = [];

const loadedfiles: string[] = [];
loadGrammar('survey.json');

checkGrammar();
checkTags();
generateGrammarHTML();

export class Tracery {

    customDict: { [key: string]: string[] } = {};
    seen: { [key: string]: Set<string> } = {};
    shuffleQuestion = false;
    typeFilter?: AnswerType;
    filterTags?: string[]; // Do not include any item with tags in this list
    rng: any;
    chance = 1;
    foundTags: Set<string> = new Set();

    question: Question = new Question();

    constructor(people: string[] = [], customSeed = '', questionOrigin = -1, typeFilter?: AnswerType, filterTags?: string[]) {
        this.customDict['monthNow'] = [months[(new Date()).getMonth()]];
        this.customDict['yearNow'] = [months[(new Date()).getFullYear()]];

        this.seen = {};
        this.question.questionOrigin = questionOrigin;
        this.customDict['person'] = people;

        if (questionOrigin !== -1) {
            this.shuffleQuestion = true;
            [this.rng, this.question.seed] = setSeed('');
            this.question.seed = customSeed ?? '';
        } else {
            [this.rng, this.question.seed] = setSeed(customSeed);
        }

        this.typeFilter = typeFilter;
        this.filterTags = filterTags;
    }

    start(origin = 'question') {
        if (grammar['test!'] !== undefined) {
            origin = 'test!';
        }

        this.question.text = '';
        this.question.choices = [];
        this.question.answerKey = 'answer';
        this.question.answerType = 'text';
        this.question.answerCount = 1;
        this.question.scaleValues = ['1', '2', '3', '4', '5'];
        this.question.otherOptionAllow = true;
        this.question.custom = false;
        this.question.vars = {};

        this.generateQuestion(origin);
        this.generateAnswer();
    }

    simpleStart(origin: string) {
        this.question.vars = {};
        return this.ParseKey(origin);
    }

    getQuestion(): Question {
        return this.question;
    }

    setQuestion(q: Question): void {
        this.question = q;
    }

    generateQuestion(origin: string) {
        this.chance = 1;
        this.question.text = this.ParseKey(origin, true);

        delete this.question.vars['tag'];

        if (this.question.vars['type'] !== undefined) {
            this.question.answerType = this.question.vars['type'];
            delete this.question.vars['type'];
        }
        if (this.question.vars['other'] !== undefined) {
            this.question.otherOptionAllow = this.question.vars['other'];
            delete this.question.vars['other'];
        }
        if (this.question.vars['key'] !== undefined) {
            this.question.answerKey = this.question.vars['key'];
            delete this.question.vars['key'];

            if (this.question.vars['count'] !== undefined) {
                this.question.answerCount = parseInt(this.question.vars['count'], 10);
                delete this.question.vars['count'];
                if (isNaN(this.question.answerCount)) {
                    this.question.answerCount = 1;
                }
            }
            if (this.question.answerCount === 1) {
                this.question.answerCount = randomNext(3, 8, this.rng);
            }
            this.question.answerKeys = this.question.answerKey.split(',');
            this.chance *= this.question.answerKeys.length;
            this.question.answerKey = this.question.answerKeys[randomNext(0, this.question.answerKeys.length, this.rng)];
        }
        this.question.qChance = this.chance;
    }

    generateAnswer(index = -1) {
        if (this.question.answerCount === 0) {
            this.question.choices = ['Answer'];
            return;
        }

        if (index === -1) {
            this.question.choices = [];
            if (this.question.answerCount === -1) {
                let allAnswers: string[] = grammar[this.question.answerKey] ?? this.customDict[this.question.answerKey] ?? [];
                allAnswers.forEach(a => {
                    let choice = ModString(this.ParseString(a), 'capitalize', this.rng);
                    this.question.choices.push(choice);
                });
            } else {
                for (let i = 0; i < this.question.answerCount; i++) {
                    this.question.choices.push(this.ParseString(`#${this.question.answerKey}.capitalize#`));
                }
            }
        } else {
            this.question.choices[index] = this.ParseString(`#${this.question.answerKey}.capitalize#`);
        }
    }

    GetRandom(key: string, isOrigin = false): string {
        var dict = grammar[key] ? grammar : this.customDict;
        if (!dict[key] || dict[key].length === 0) return key;

        let value = 0;

        // Filtering -------------------------------------------------------
        const filteredList = dict[key].filter(str => {
            let toReturn = true;
            let m;
            while ((m = regexVariable.exec(str)) !== null) {
                // This is necessary to avoid infinite loops with zero-width matches
                if (m.index === regexVariable.lastIndex) {
                    regexVariable.lastIndex++;
                }

                const filterKey: string = m.groups['key'] ?? '';
                const filterValue: string = m.groups['value'] ?? '';

                // Filter out tags
                if (filterKey === 'tag') {
                    const tags = filterValue.split(',');
                    tags.forEach(f => {
                        if (this.filterTags?.includes(f) ?? false) {
                            toReturn = false;
                        }
                    });
                }

                // Filter out specific question types
                if (isOrigin && this.typeFilter) {
                    if (filterKey === 'type' && filterValue !== this.typeFilter) {
                        toReturn = false;
                    }
                }
            }
            return toReturn;
        });

        this.chance *= filteredList.length || 1;
        value = randomNext(0, filteredList.length, this.rng);
        value = dict[key].findIndex((x: string) => x === filteredList[value]);
        // ----------------------------------------------------------------

        // Overwrite or use origin to regenerate the same question
        if (isOrigin && this.question.questionOrigin !== -1) {
            return dict[key][this.question.questionOrigin];
        }
        if (isOrigin) {
            this.question.questionOrigin = value;
        }

        return value === -1 ? key : dict[key][value];
    }

    // Theres probably a better way to do this while allowing $ and : in the text
    ParseInlineChoice(value: string) {
        // Look for all text between ^$ and $
        value = value.replace(new RegExp(regexInlineChoiceGroup), (...match: string[]) => {
            const groups = match.pop();
            let choiceGroup: string = groups?.['choices'] ?? '';
            choiceGroup = choiceGroup.replace(/\\\$/g, '$'); // Fixed escaped $ character

            let choices: string[] = choiceGroup.split(regexInlineChoices);
            choices = choices.map(s => s.replace(/\\:/g, ':'));

            this.chance *= choices.length || 1;
            if (choices.length === 0) { return ''; }
            return choices[randomNext(0, choices.length, this.rng)];
        });
        return value;
    }

    ParseString(str: string) {
        str = this.ParseInlineChoice(str);

        str = str.replace(new RegExp(regexVariable), (...match: string[]) => {
            const groups = match.pop();
            const key = groups?.['key'] ?? '';
            const val = groups?.['value'] ?? '';

            let variable = this.ParseString(val);
            this.question.vars[key] = variable;
            return '';
        });


        str = str.replace(new RegExp(regexString), (...match: string[]) => {
            const groups = match.pop();
            const key = groups?.["key"] ?? '';
            const mod = groups?.["mod"] ?? '';

            let toReturn = this.ParseKey(key);
            if (mod) {
                toReturn = ModString(toReturn, mod, this.rng);
            }

            return toReturn;
        });

        return str;
    }

    ParseKey(key: string, isOrigin = false) {
        // Handle wildcard key
        if (key === '*') {
            this.chance *= grammarKeys.length || 1;
            key = grammarKeys[randomNext(0, grammarKeys.length, this.rng)];
        }

        if (this.question.vars[key] !== undefined) {
            return this.question.vars[key];
        }

        var dict = grammar;
        if (dict[key] === undefined) dict = this.customDict;
        if (dict[key] === undefined) return key;

        // Make sure that we haven't already chosen this option
        var value = this.ParseString(this.GetRandom(key, isOrigin));
        // Make sure there is a valid string set
        if (this.seen[key] === undefined) {
            this.seen[key] = new Set();
        }

        // Only try again if we havent seen all the keys in the list
        if (this.seen[key].size < dict[key].length) {
            let tries = 0 // Prevent infinite loops
            while (this.seen[key].has(value) && tries < dict[key].length * 2) {
                tries++;
                value = this.ParseString(this.GetRandom(key, isOrigin));
            }
            this.seen[key].add(value);
        } else {
            this.seen[key].clear();
        }

        return value;
    }

}

// Load multiple grammar files and merge them
function loadGrammar(filename: string) {
    loadedfiles.push(filename);

    const grammarTemp = JSON.parse(fs.readFileSync(`./data/${filename}`,
        { encoding: 'utf8', flag: 'r' }));

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
            if (dupIndex < index && dupIndex >= 0) {
                console.warn(`Duplicate value: "${key}"": "${value}" (${index})`);
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
