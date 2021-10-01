import { setSeed, randomNext } from './tracery.math';
import { ModString } from './tracery.mod';
import { Question } from '../app/src/app/shared/model/question.model';

import fs from 'fs';

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const regexVariable = /\[(?<key>.+?):(?<value>.+?)\]/gm; // [key:value] -> key, value
const regexVars = /^(?<vars>(\[[a-zA-Z0-9_ -:.#]+?\])+)/m; // [key:value]Test -> [key:value]
const regexString = /(#(?<vars>(\[[a-zA-Z0-9_ -:.#]+?\])*?)(?<key>[a-zA-Z0-9_:]+)\.?(?<mod>[a-zA-Z0-9_.]*?)#)/m; // #key#, #key.s#, #[key:value]key#
const regexInlineChoice = /\^\$(?<choice>.*?:.*?)\$/m; // ^$first:second$ -> first or second

const grammar: any = {};
const loadedfiles: string[] = [];
loadGrammar('survey.json');

export class Tracery {

    customDict: any = {};
    seen: any = {};
    shuffleQuestion = false;
    rng;

    question: Question = new Question();

    constructor(people: string[] = [], customSeed = '', questionOrigin = -1) {
        this.customDict['monthNow'] = [months[(new Date()).getMonth()]];
        this.customDict['yearNow'] = [months[(new Date()).getFullYear()]];

        this.seen = {};
        this.question.questionOrigin = questionOrigin;
        if (people.length > 0) {
            this.customDict['person'] = people;
        }

        if (questionOrigin !== -1) {
            this.shuffleQuestion = true;
            [this.rng, this.question.seed] = setSeed('');
            this.question.seed = customSeed ?? '';
        } else {
            [this.rng, this.question.seed] = setSeed(customSeed);
        }
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
        this.question.text = this.ParseKey(origin, true);
        if (this.question.vars['answerType'] !== undefined) {
            this.question.answerType = this.question.vars['answerType'];
        }
        if (this.question.vars['answerAllowOther'] !== undefined) {
            this.question.otherOptionAllow = this.question.vars['answerAllowOther'];
        }
        if (this.question.vars['answerKey'] !== undefined) {
            this.question.answerKey = this.question.vars['answerKey'];

            if (this.question.vars['answerCount'] !== undefined) {
                this.question.answerCount = parseInt(this.question.vars['answerCount'], 10);
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
                const allAnswers: string[] = grammar[this.question.answerKey] ?? [];
                allAnswers.forEach(a => {
                    let choice = ModString(this.ParseKey(a), 'capitalize', this.rng);
                    this.question.choices.push(choice);
                });
                // let choice = this.ParseString(`#${this.question.answerKey}.capitalize#`);
                // while (this.question.choices.indexOf(choice) === -1) {
                //     this.question.choices.push(choice);
                //     choice = this.ParseString(`#${this.question.answerKey}.capitalize#`);
                // }
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
        var dict = grammar;
        if (dict[key] === undefined) dict = this.customDict;
        if (dict[key] === undefined) return key;
        if (dict[key].length === 0) return key;
        const value = randomNext(0, dict[key].length, this.rng);

        // Overwrite or use origin to regenerate the same question
        if (isOrigin && this.question.questionOrigin !== -1) {
            return dict[key][this.question.questionOrigin];
        }
        if (isOrigin) {
            this.question.questionOrigin = value;
        }

        return dict[key][value];
    }

    ParseVariables(variables: string) {
        let m;
        while ((m = regexVariable.exec(variables)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regexVariable.lastIndex) {
                regexVariable.lastIndex++;
            }

            const key = m.groups?.['key'] ?? '';
            let value = m.groups?.['value'] ?? '';
            value = this.ParseString(value);

            this.question.vars[key] = value;
        }
    }

    ParseInlineChoice(value: string) {
        let m;
        while ((m = regexInlineChoice.exec(value)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regexInlineChoice.lastIndex) {
                regexInlineChoice.lastIndex++;
            }

            const choices = m.groups?.['choice'].split(':') ?? '';
            if (choices.length === 0) value = value.replace(m[0], '');

            value = value.replace(m[0], choices[randomNext(0, choices.length, this.rng)]);
        }
        return value;
    }

    ParseString(value: string) {
        value = this.ParseInlineChoice(value);

        let m;
        while ((m = regexVars.exec(value)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regexVars.lastIndex) {
                regexVars.lastIndex++;
            }

            this.ParseVariables(m.groups?.['vars'] ?? '');
            value = value.replace(m[0], '');
        }


        while ((m = regexString.exec(value)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regexString.lastIndex) {
                regexString.lastIndex++;
            }

            const variables = m.groups?.["vars"] ?? '';
            const key = m.groups?.["key"] ?? '';
            const mod = m.groups?.["mod"] ?? '';

            if (variables !== '') {
                this.ParseVariables(variables);
            }

            let toReturn = this.ParseKey(key);
            if (mod !== '') {
                toReturn = ModString(toReturn, mod, this.rng);
            }

            value = value.replace(m[0], toReturn);
        }

        return value;
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

        // Check for duplicate values
        grammar[key].forEach((value: string, index: number) => {
            const dupIndex = grammar[key].findIndex((x: string) => x === value);
            if (dupIndex < index && dupIndex >= 0) {
                console.warn(`Duplicate value: ${filename} -> ${key}: [${value}] ${index}`);
            }
        });
    });

    if (grammarTemp['require!'] !== undefined) {
        grammarTemp['require!'].forEach((file: string) => {
            if (loadedfiles.findIndex(x => x === file) === -1) {
                loadGrammar(file);
            }
        })
    }
}
