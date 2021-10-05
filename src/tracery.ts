import { setSeed, randomNext } from './tracery.math';
import { ModString } from './tracery.mod';
import { AnswerType, Question } from '../app/src/app/shared/model/question.model';

import fs from 'fs';

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const reservedKeys = ['type', 'key', 'count', 'other', 'tag']; // Used for question formatting, do not use as keys in grammar - #key#

const regexVariable = /\[(?<key>[a-zA-Z0-9_]+):(?<value>.+?)\]/gm; // [key:value] -> key, value
const regexString = /(#(?<key>[a-zA-Z0-9_]+)\.?(?<mod>[a-zA-Z0-9_.]*?)#)/gm; // #key#, #key.s#
const regexInlineChoiceGroup = /\^\$(?<choices>(?:[^\$\\]*(?:\\.)?)*)\$/gm; // ^$first:second$ -> first:second
const regexInlineChoices = /(?<choice>(?:\\.|[^:\\]+)+)/gm; // first:second -> ["first", "second"]

const grammar: { [key: string]: string[] } = {};
const tags: Set<string> = new Set();

const loadedfiles: string[] = [];
loadGrammar('survey.json');

checkGrammar();
checkTags();

export class Tracery {

    customDict: { [key: string]: string[] } = {};
    seen: { [key: string]: Set<string> } = {};
    shuffleQuestion = false;
    typeFilter?: AnswerType;
    rng: any;
    chance = 1;

    question: Question = new Question();

    constructor(people: string[] = [], customSeed = '', questionOrigin = -1, typeFilter?: AnswerType) {
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
        this.question.qChance = this.chance;

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
                this.question.answerCount = randomNext(3, 5, this.rng);
            }
        }
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
        if (this.typeFilter && isOrigin) {
            const temp = dict[key].filter((x: string) => x.includes(`[type:${this.typeFilter}]`));
            this.chance *= temp.length || 1;
            value = randomNext(0, temp.length, this.rng);
            value = dict[key].findIndex((x: string) => x === temp[value]);
            if (value === -1) { value = 0; }
        } else {
            this.chance *= dict[key].length || 1;
            value = randomNext(0, dict[key].length, this.rng);
        }

        // Overwrite or use origin to regenerate the same question
        if (isOrigin && this.question.questionOrigin !== -1) {
            return dict[key][this.question.questionOrigin];
        }
        if (isOrigin) {
            this.question.questionOrigin = value;
        }

        return dict[key][value];
    }

    // Theres probably a better way to do this while allowing $ and : in the text
    ParseInlineChoice(value: string) {
        // Look for all text between ^$ and $
        value = value.replace(new RegExp(regexInlineChoiceGroup), (...match: string[]) => {
            const groups = match.pop();
            let choiceGroup: string = groups?.['choices'] ?? '';
            choiceGroup = choiceGroup.replace(/\\\$/g, '$'); // Fixed escaped $ character

            const choices: string[] = [];

            let m;
            // Look for all groups in text a:b:c...
            while ((m = regexInlineChoices.exec(choiceGroup)) !== null) {
                if (m.index === regexInlineChoices.lastIndex) {
                    regexInlineChoices.lastIndex++;
                }

                let choice = m.groups?.['choice'] ?? '';
                choice = choice.replace(/\\:/g, ':'); // Fixed escaped : character
                choices.push(choice);
            }

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
            while (this.seen[key].has(value)) {
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
}

function checkTags() {
    const keys: string[] = Object.keys(grammar);

    keys.forEach(key => {
        grammar[key].forEach((str: string, index: number) => {

            grammar[key][index] = str.replace(new RegExp(regexVariable), (...match: string[]) => {
                const groups = match.pop();
                const key = groups?.['key'] ?? '';
                if (key === 'tag') {
                    const value = groups?.['value'] ?? '';
                    value.split(',').forEach((x: string) => tags.add(x));
                    return '';
                }
                return match[0];
            });
        });
    });

    console.log(tags);
}
