const fs = require('fs');

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const vowels = 'aeiouAEIOU';
const consonants = 'bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ';

const regexVariable = /\[(?<key>.+?):(?<value>.+?)\]/gm;
const regexVars = /^(?<vars>(\[[a-zA-Z0-9_:.#]+?\])+)/m;
const regexString = /(#(?<vars>(\[[a-zA-Z0-9_:#]+?\])*?)(?<key>[a-zA-Z0-9_:]+)\.?(?<mod>[a-zA-Z.]*?)#)/m;
const regexInlineChoice = /\$(?<choice>.+?:.+?)\$/m;

const grammar = {};
const loadedfiles = [];
loadGrammar('survey.json');

class Tracery {

    customDict = {};
    seen = {};

    question = '';
    choices = [];
    answerKey = '';
    answerType = 'text';
    answerCount = 0;
    allowOther = true;
    answerOrigin = -1;
    vars = {};


    init(people = []) {
        this.customDict['monthNow'] = [months[(new Date()).getMonth()]];
        this.seen = {};
        this.answerOrigin = -1;
        if (people.length > 0) {
            this.customDict['person'] = people;
        }
    }

    start(origin = 'question') {
        if (grammar['test!'] !== undefined) {
            origin = 'test!';
        }

        this.question = '';
        this.choices = [];
        this.answerKey = '';
        this.answerType = 'text';
        this.answerCount = 0;
        this.allowOther = true;
        this.vars = {};

        this.generateQuestion(origin);
        this.generateAnswer();
    }

    simpleStart(origin) {
        this.vars = {};
        return this.ParseKey(origin);
    }

    getJSON() {
        return {
            text: this.question,
            choices: this.choices,
            answerKey: this.answerKey,
            answerType: this.answerType,
            answerCount: this.answerCount,
            allowOther: this.allowOther,
            answerOrigin: this.answerOrigin,
            vars: this.vars
        };
    }

    setJSON(json) {
        this.question = json.text;
        this.choices = json.choices;
        this.answerKey = json.answerKey;
        this.answerType = json.answerType;
        this.answerCount = json.answerCount;
        this.allowOther = json.allowOther;
        this.answerOrigin = json.answerOrigin;
        this.vars = json.vars;
    }

    generateQuestion(origin) {
        this.question = this.ParseKey(origin, true);
        if (this.vars['answerType'] !== undefined) {
            this.answerType = this.vars['answerType'];
        }
        if (this.vars['answerAllowOther'] !== undefined) {
            this.allowOther = this.vars['answerAllowOther'];
        }
        if (this.vars['answerKey'] !== undefined) {
            this.answerKey = this.vars['answerKey'];

            if (this.vars['answerCount'] !== undefined) {
                this.answerCount = +this.vars['answerCount'];
            }
            if (this.answerCount === 0) {
                this.answerCount = randomNext(3, 5);
                if (this.answerKey === 'yesNo') this.answerCount = 2;
            }
        }
    }

    generateAnswer(index = -1) {
        if (index === -1) {
            this.choices = [];
            for (let i = 0; i < this.answerCount; i++) {
                this.choices.push(this.ParseString(`#${this.answerKey}.capitalize#`));
            }
        } else {
            this.choices[index] = this.ParseString(`#${this.answerKey}.capitalize#`);
        }
    }

    GetRandom(key, isOrigin=false) {
        var dict = grammar;
        if (dict[key] === undefined) dict = this.customDict;
        if (dict[key] === undefined) return key;
        if (dict[key].length === 0) return key;
        const value = randomNext(0, dict[key].length);

        // Overwrite or use origin to regenerate the same question
        if (isOrigin && this.answerOrigin !== -1) {
            return dict[key][this.answerOrigin];
        }
        if (isOrigin) {
            this.answerOrigin = value;
        }

        return dict[key][value];
    }

    ModString(value, mod) {
        const mods = mod.split('.');
        let toReturn = value;
        mods.forEach(m => {
            switch (m) {
                case 'capitalize':
                    toReturn = value.substring(0, 1).toUpperCase() + value.substring(1);
                    break;
                case 'a':
                    toReturn = vowels.indexOf(value[0]) >= 0 ? `an ${value}` : `a ${value}`;
                    break;
                case 'ed':
                    if (value.endsWith("e"))
                        toReturn = `${value}d`;
                    else
                        toReturn = `${value}ed`;
                    break;
                case 's':
                    if (value.endsWith("es"))
                        toReturn = value;
                    else if (value.endsWith("s"))
                        toReturn = `${value}es`;
                    else if (value.endsWith('y') && consonants.indexOf(value[value.length-2]) >= 0)
                        toReturn = `${value.substring(0, value.length-1)}ies`;
                    else
                        toReturn = `${value}s`;
                    break;
                case 'possessive':
                    if (value.endsWith("s"))
                        toReturn = `${value}'`;
                    else
                        toReturn = `${value}'s`;
                    break;
                case 'range':
                    const values = value.split(":");
                    const start = +values[0];
                    const end = +values[1];
                    if (values.length === 3) {
                        toReturn = roundUp(randomNext(start, end), +values[2]).toString();
                        break;
                    } else
                        toReturn = randomNext(start, end).toString();
                    break;
                default:
                    console.log(`Unknown Mod: ${m}`);
                    toReturn = value;
                    break;
            }
        });
        return toReturn;
    }

    ParseVariables(variables) {
        let m;
        while ((m = regexVariable.exec(variables)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regexVariable.lastIndex) {
                regexVariable.lastIndex++;
            }

            const key = m.groups['key'];
            let value = m.groups['value'];
            value = this.ParseString(value);

            this.vars[key] = value;
        }
    }

    ParseInlineChoice(value) {
        let m;
        while ((m = regexInlineChoice.exec(value)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regexInlineChoice.lastIndex) {
                regexInlineChoice.lastIndex++;
            }

            const choices = m.groups['choice'].split(':');
            if (choices.length === 0) value = value.replace(m[0], '');

            value = value.replace(m[0], choices[randomNext(0, choices.length)]);
        }
        return value;
    }

    ParseString(value) {
        value = this.ParseInlineChoice(value);

        let m;
        while ((m = regexVars.exec(value)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regexVars.lastIndex) {
                regexVars.lastIndex++;
            }

            this.ParseVariables(m.groups['vars']);
            value = value.replace(m[0], '');
        }


        while ((m = regexString.exec(value)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regexString.lastIndex) {
                regexString.lastIndex++;
            }

            const variables = m.groups["vars"];
            const key = m.groups["key"];
            const mod = m.groups["mod"];

            if (variables !== '') {
                this.ParseVariables(variables);
            }

            let toReturn = this.ParseKey(key);
            if (mod !== '') {
                toReturn = this.ModString(toReturn, mod);
            }

            value = value.replace(m[0], toReturn);
        }

        return value;
    }

    ParseKey(key, isOrigin=false) {
        if (this.vars[key] !== undefined) {
            return this.vars[key];
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

function randomNext(minValue, maxValue) {
    return Math.floor((Math.random() * (maxValue - minValue)) + minValue);
}

function roundUp(numToRound, multiple = 0) {
    if (multiple === 0) return numToRound;

    const remainder = Math.abs(numToRound) % multiple;
    if (remainder === 0) numToRound;

    if (numToRound < 0) {
        return -(Math.abs(numToRound) - remainder);
    } else {
        return numToRound + multiple - remainder;
    }
}

// Load multiple grammar files and merge them
function loadGrammar(filename) {
    loadedfiles.push(filename);

    grammarTemp = JSON.parse(fs.readFileSync(`./data/${filename}`,
        { encoding: 'utf8', flag: 'r' }));

    Object.keys(grammarTemp).forEach(key => {
        if (grammar[key] === undefined) {
            grammar[key] = grammarTemp[key];
        } else {
            grammar[key].concat(grammarTemp[key]);
        }
    });

    if (grammarTemp['require!'] !== undefined) {
        grammarTemp['require!'].forEach(file => {
            if (loadedfiles.findIndex(x => x === file) === -1) {
                loadGrammar(file);
            }
        })
    }
}

module.exports = Tracery;