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
            case 'ing':
                if (value.endsWith("ie"))
                    value = `${value.substring(0, value.length - 2)}ying`;
                else if (value.endsWith("ee") || value.endsWith("ye") || value.endsWith("oe"))
                    value = `${value}ing`;
                else if (value.endsWith("e"))
                    value = `${value.substring(0, value.length - 1)}ing`;
                else if (value.endsWith("c"))
                    value = `${value}king`;
                else if (value.endsWith('w') || value.endsWith('y') || value.endsWith('x'))
                    value = `${value}ing`;
                else if (consonants.indexOf(value[value.length - 1]) >= 0 && vowels.indexOf(value[value.length - 2]) >= 0)
                    value = `${value}${value[value.length - 1]}ing`;
                else
                    value = `${value}ing`;
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
                // No idea why but when you roundUp end doesn't need the +1
                if (step) {
                    value = roundUp(randomNext(start, end, rng), step).toString();
                } else {
                    value = randomNext(start, end + 1, rng).toString();
                }
                if (pad) {
                    value = value.padStart(pad, '0');
                }
                break;
            case 'ord':
                const num = parseInt(value, 10);
                if (isNaN(num)) { break; }
                if (num >= 4 && num <= 20) {
                    value += 'th';
                } else {
                    const ones = Math.floor(num % 10);
                    switch (ones) {
                        case 1:
                            value += 'st';
                            break;
                        case 2:
                            value += 'nd';
                            break;
                        case 3:
                            value += 'rd';
                            break;
                        default:
                            value += 'th';
                    }
                }
                break;
            case 'num':
                const num1 = +value;
                value = num1.toLocaleString('en-US');
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
            case 'html_h':
                value = `<h2>${value}</h2>`;
                break;
            default:
                console.log(`Unknown Mod: ${m}`);
                value = value;
                break;
        }
    });
    return value;
}
