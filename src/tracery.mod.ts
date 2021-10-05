import { randomNext, roundUp } from './tracery.math';

const vowels = 'aeiouAEIOU';
const consonants = 'bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ';

export function ModString(value: string, mod: string, rng: any): string {
    const mods = mod.split('.');
    mods.forEach(m => {
        switch (m) {
            case 'capitalize':
                value = value.substring(0, 1).toUpperCase() + value.substring(1);
                break;
            case 'a':
                value = vowels.indexOf(value[0]) >= 0 ? `an ${value}` : `a ${value}`;
                break;
            case 'ed':
                if (value.endsWith("e"))
                    value = `${value}d`;
                else
                    value = `${value}ed`;
                break;
            case 's':
                if (value.endsWith("es"))
                    value = value;
                else if (value.endsWith("s"))
                    value = `${value}es`;
                else if (value.endsWith('y') && consonants.indexOf(value[value.length - 2]) >= 0)
                    value = `${value.substring(0, value.length - 1)}ies`;
                else
                    value = `${value}s`;
                break;
            case 'possessive':
                if (value.endsWith("s"))
                    value = `${value}'`;
                else
                    value = `${value}'s`;
                break;
            case 'range':
                const [start, end, step, pad] = value.split("_").map(x => +x);
                if (step) {
                    value = roundUp(randomNext(start, end, rng), step).toString();
                } else {
                    value = randomNext(start, end, rng).toString();
                }
                if (pad) {
                    value = value.padStart(pad, '0');
                }
                break;

            // HTML Mods
            case 'html_i':
                value = `<i>${value}</i>`;
                break;
            case 'html_b':
                value = `<b>${value}</b>`;
                break;
            case 'html_em':
                value = `<em>${value}</em>`;
                break;
            case 'html_s':
                value = `<s>${value}</s>`;
                break;
            case 'html_sub':
                value = `<sub>${value}</sub>`;
                break;
            case 'html_sup':
                value = `<sup>${value}</sup>`;
                break;
            case 'html_u':
                value = `<u>${value}</u>`;
                break;
            default:
                console.log(`Unknown Mod: ${m}`);
                value = value;
                break;
        }
    });
    return value;
}
