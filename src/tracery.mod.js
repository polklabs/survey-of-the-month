const tMath = require('./tracery.math');

const vowels = 'aeiouAEIOU';
const consonants = 'bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ';

function ModString(value, mod, rng) {
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
                    toReturn = tMath.roundUp(tMath.randomNext(start, end, rng), +values[2]).toString();
                    break;
                } else
                    toReturn = tMath.randomNext(start, end, rng).toString();
                break;

            // HTML Mods
            case 'html_i':
                toReturn = `<i>${value}</i>`;
                break;
            case 'html_b':
                toReturn = `<b>${value}</b>`;
                break;
            case 'html_em':
                toReturn = `<em>${value}</em>`;
                break;
            case 'html_s':
                toReturn = `<s>${value}</s>`;
                break;
            case 'html_sub':
                toReturn = `<sub>${value}</sub>`;
                break;
            case 'html_sup':
                toReturn = `<sup>${value}</sup>`;
                break;
            case 'html_u':
                toReturn = `<u>${value}</u>`;
                break;
            default:
                console.log(`Unknown Mod: ${m}`);
                toReturn = value;
                break;
        }
    });
    return toReturn;
}

module.exports.ModString = ModString;