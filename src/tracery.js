const fs = require('fs');
const tMath = require('./tracery.math');
const tMod = require('./tracery.mod');

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const regexVariable = /\[(?<key>.+?):(?<value>.+?)\]/gm;
const regexVars = /^(?<vars>(\[[a-zA-Z0-9_:.#]+?\])+)/m;
const regexString = /(#(?<vars>(\[[a-zA-Z0-9_:.#]+?\])*?)(?<key>[a-zA-Z0-9_:]+)\.?(?<mod>[a-zA-Z0-9_.]*?)#)/m;
const regexInlineChoice = /\^\$(?<choice>.+?:.+?)\$/m;

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

    constructor(people = []) {
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
                this.answerCount = tMath.randomNext(3, 5);
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
        const value = tMath.randomNext(0, dict[key].length);

        // Overwrite or use origin to regenerate the same question
        if (isOrigin && this.answerOrigin !== -1) {
            return dict[key][this.answerOrigin];
        }
        if (isOrigin) {
            this.answerOrigin = value;
        }

        return dict[key][value];
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

            value = value.replace(m[0], choices[tMath.randomNext(0, choices.length)]);
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
                toReturn = tMod.ModString(toReturn, mod);
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