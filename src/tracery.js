const fs = require('fs');

const months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];

const regexVariable = /\[(?<key>.+?):(?<value>.+?)\]/gm;
const regexVars = /^(?<vars>(\[[a-zA-Z0-9_:#]+?\])+)/m;
const regexString = /(#(?<vars>(\[[a-zA-Z0-9_:#]+?\])*?)(?<key>[a-zA-Z0-9_:]+)\.?(?<mod>[a-zA-Z]*?)#)/m;

var grammar = loadGrammar();


class Tracery {

    customDict = {};
    vars = {};
    seen = {};

    question = '';
    answer = {
        answers: [],
        answerKey: '',
        answerType: 'text',
        answerCount: 0
    };
    

    init() {
        this.customDict['person'] = [ "kate", "madison", "andrew", "shireen", "emma", "avah", "paulina", "jasmine" ];
        this.customDict['monthNow'] = months[(new Date()).getMonth()];        
        this.seen = {};
    }

    start(origin = 'question') {
        this.vars = {};
        this.question = '';
        this.answer = {
            answers: [],
            answerKey: '',
            answerType: 'text',
            answerCount: 0
        };

        this.generateQuestion(origin);
        this.generateAnswer();
    }

    generateQuestion(origin) {
        this.question = this.ParseKey(origin);
        if (this.vars['answerType'] !== undefined) {
            this.answer.answerType = this.vars['answerType'];
        }
        if (this.vars['answerKey'] !== undefined) {
            this.answer.answerKey = this.vars['answerKey'];

            if (this.vars['answerCount'] !== undefined) {
                this.answer.answerCount = +this.vars['answerCount'];
            }
            if (this.answer.answerCount === 0) {
                this.answer.answerCount = randomNext(3,5);
                if (this.answer.answerKey === 'yesNo') this.answer.answerCount = 2;
            }
        }
    }

    generateAnswer(index = -1) {
        if (index === -1) {
            for (let i = 0; i < this.answer.answerCount; i++) {                
                this.answer.answers.push(this.ParseString(`#${this.answer.answerKey}.capitalize#`));
                // console.log(`(${i+1}) ${answer}`);
            }
        } else {
            this.answer.answers[index] = this.ParseString(`#${this.answer.answerKey}.capitalize#`);
        }
    }

    GetRandom(key) {
        var dict = grammar;
        if (dict[key] === undefined) dict = this.customDict;
        if (dict[key] === undefined) return key;
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
        if (dict[key] === undefined) return this.ParseString(this.GetRandom(key));

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

function loadGrammar() {
    return JSON.parse(fs.readFileSync('./data/survey.json',
            {encoding:'utf8', flag:'r'}));
}

module.exports = Tracery;