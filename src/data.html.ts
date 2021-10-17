import { regexInlineChoiceGroup, regexInlineChoices, regexString, regexVariable, reservedKeys } from "./tracery.const";
import { grammar } from "./tracery.load";

export let grammarHTML = '';

export function generateGrammarHTML(): void {
    let html = '';
    
    const keys = Object.keys(grammar);
    keys.forEach(key => {
        if (key.includes('!')) { return; }
        if (grammar[key].length === 0) { return; }

        html += `<div id="${key}">${key}: [\n`;
        if (key.endsWith('question')) {
            html += `<p>${grammar[key].map(x => `"${formatString(x)}"`).join(',<br>')}</p>\n`
        } else {
            html += `<p>${grammar[key].map(x => `"${formatString(x)}"`).join(', ')}</p>\n`
        }
        html += `],</div>`
    });

    grammarHTML = html;
}

function formatString(str: string): string {
    str = str.replace(/\</gm, '&lt;');
    str = str.replace(/\>/gm, '&gt;');

    str = str.replace(new RegExp(regexInlineChoiceGroup), (...match: string[]) => {
        const groups = match.pop();
        let choiceGroup: string = groups?.['choices'] ?? '';
        let choices: string[] = choiceGroup.split(regexInlineChoices);

        let toReturn = '<i style="color: deeppink">^$</i>';
        toReturn += choices.map(x => `<span style="background-color: darkred">${x}</span>`).join('<i style="color: deeppink">:</i>');
        toReturn += '<i style="color: deeppink">$</i>';

        return toReturn;
    });

    str = str.replace(new RegExp(regexVariable), (...match: string[]) => {
        const groups = match.pop();
        const key = groups?.['key'] ?? '';
        const val = groups?.['value'] ?? '';

        let toReturn = '<em>[';
        if (reservedKeys.includes(key)) {
            toReturn += `<span style="color: darkseagreen">${key}</span>:<span style="color: violet">${val}</span>`;
        } else {
            toReturn += `<span style="color: lawngreen">${key}</span>:<span style="color: violet">${val}</span>`;
        }
        toReturn += ']</em>';

        return toReturn;
    });

    str = str.replace(new RegExp(regexString), (...match: string[]) => {
        const groups = match.pop();
        const key = groups?.["key"] ?? '';
        const mod = groups?.["mod"] ?? '';

        let toReturn = '';
        if (grammar[key] === undefined) {
            toReturn = `<span style="color: darkorange !important">#${key}`;
        } else {
            toReturn = `<a href="/grammar#${key}" style="color: darkorange !important">#${key}`;
        }
        if (mod) {
            toReturn += `<span style="color: deepskyblue">.${mod}</span>`;
        }
        if (grammar[key] === undefined) {
            toReturn += '#</span>';
        } else {
            toReturn += '#</a>';
        }

        return toReturn;
    });

    return str;
}
