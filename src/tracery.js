const fs = require('fs');

const months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];

const regexVariable = /\[(?<key>.+?):(?<value>.+?)\]/gm;
const regexVars = /^(?<vars>(\[[a-zA-Z0-9_:#]+?\])+)/m;
const regexString = /(#(?<vars>(\[[a-zA-Z0-9_:#]+?\])*?)(?<key>[a-zA-Z0-9_:]+)\.?(?<mod>[a-zA-Z]*?)#)/m;

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
    vars = {};
    

    init(people = []) {
        this.customDict['monthNow'] = months[(new Date()).getMonth()];        
        this.seen = {};
        if (people.length > 0) {
            this.customDict['person'] = people;
        }
    }

    start(origin = 'question') {
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

    getJSON() {
        return {
            text: this.question, 
            choices: this.choices,
            answerKey: this.answerKey,
            answerType: this.answerType,
            answerCount: this.answerCount,
            allowOther: this.allowOther,
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
        this.vars = json.vars;
    }

    generateQuestion(origin) {
        this.question = this.ParseKey(origin);
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
                this.answerCount = randomNext(3,5);
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

    GetRandom(key) {
        var dict = grammar;
        if (dict[key] === undefined) dict = this.customDict;
        if (dict[key] === undefined) return key;
        if (dict[key].length === 0) return key;
        return dict[key][randomNext(0, dict[key].length)];
    }

    ModString(value, mod) {
        switch(mod) {
            case 'capitalize':
                return value.substring(0, 1).toUpperCase() + value.substring(1);
            case 'a':
                return 'aeiouAEIOU'.indexOf(value[0]) >= 0 ? `an ${value}` : `a ${value}`;
            case 'ed':
                if (value.endsWith("e")) return `${value}d`;
                return `${value}ed`;
            case 's':
                if (value.endsWith("s")) return `${value}es`;
                return `${value}s`;
            case 'range':
                const values = value.split(":");
                const start = +values[0];
                const end = +values[1];
                return randomNext(start, end).toString();
            default:
                console.log(`Unknown Mod: ${mod}`);
                return value;
        }
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

    ParseString(value) {
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

    ParseKey(key) {
        if (this.vars[key] !== undefined) {
            return this.vars[key];
        }

        var dict = grammar;
        if (dict[key] === undefined) dict = this.customDict;
        if (dict[key] === undefined) return key;

        // Make sure that we haven't already chosen this option
        var value = this.ParseString(this.GetRandom(key));
        // Make sure there is a valid string set
        if (this.seen[key] === undefined) {
            this.seen[key] = new Set();
        }

        // Only try again if we havent seen all the keys in the list
        if (this.seen[key].size < dict[key].length) {
            while (this.seen[key].has(value)) {
                value = this.ParseString(this.GetRandom(key));
            }
            this.seen[key].add(value);
        } else {
            this.seen[key].clear();
        }

        return value;
    }

}

function randomNext(minValue, maxValue) {
    return Math.floor((Math.random()*(maxValue-minValue))+minValue);
}

// Load multiple grammar files and merge them
function loadGrammar(filename) {
    loadedfiles.push(filename);

    grammarTemp = JSON.parse(fs.readFileSync(`./data/${filename}`,
            {encoding:'utf8', flag:'r'}));

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