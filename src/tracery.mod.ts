import { getCustomMod } from "./mod.load";
import { Tracery } from "./tracery";
import { regexString } from "./tracery.const";
import { randomNext, roundUp } from "./tracery.math";

const vowels = "aeiouAEIOU";
const consonants = "bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ";

export async function ModString(
    value: string,
    list: string[],
    isEmptyValueList: boolean,
    mods: string[],
    tracery: Tracery
): Promise<string> {
    const valueList = isEmptyValueList ? [] : [...list];
    for (let m of mods) {
        let modItems = m.split("_");
        switch (modItems[0]) {
            case "capitalize":
                value =
                    value.substring(0, 1).toUpperCase() + value.substring(1);
                break;
            case "caps":
                value = value.toUpperCase();
                break;
            case "a":
                value = vowels.includes(value[0])
                    ? `an ${value}`
                    : `a ${value}`;
                break;
            case "ed":
                if (value.endsWith("e")) value = `${value}d`;
                else value = `${value}ed`;
                break;
            case "ing":
                if (value.endsWith("ie"))
                    value = `${value.substring(0, value.length - 2)}ying`;
                else if (
                    value.endsWith("ee") ||
                    value.endsWith("ye") ||
                    value.endsWith("oe")
                )
                    value = `${value}ing`;
                else if (value.endsWith("e"))
                    value = `${value.substring(0, value.length - 1)}ing`;
                else if (value.endsWith("c")) value = `${value}king`;
                else if (
                    value.endsWith("w") ||
                    value.endsWith("y") ||
                    value.endsWith("x")
                )
                    value = `${value}ing`;
                else if (
                    consonants.indexOf(value[value.length - 1]) >= 0 &&
                    vowels.indexOf(value[value.length - 2]) >= 0 &&
                    consonants.indexOf(value[value.length - 3]) >= 0
                )
                    value = `${value}${value[value.length - 1]}ing`;
                else value = `${value}ing`;
                break;
            case "s":
                if (
                    value.endsWith("s") ||
                    value.endsWith("x") ||
                    value.endsWith("z") || 
                    value.endsWith('ch') || 
                    value.endsWith('sh')
                    ) {
                    value = `${value}es`;
                }
                else if (value.endsWith('fe')) {
                    value = `${value.substring(0, value.length-2)}ves`;
                }
                else if (value.endsWith('f')) {
                    value = `${value.substring(0, value.length-1)}ves`;
                }
                else if (
                    value.endsWith("y") &&
                    vowels.indexOf(value[value.length - 2]) >= 0
                ){
                    value = `${value}s`;
                }
                else if (
                    value.endsWith("y") &&
                    consonants.indexOf(value[value.length - 2]) >= 0
                ){
                    value = `${value.substring(0, value.length - 1)}ies`;
                }
                else if (
                    value.endsWith("o") &&
                    vowels.indexOf(value[value.length - 2]) >= 0
                ){
                    value = `${value}s`;
                }
                else if (
                    value.endsWith("o") &&
                    consonants.indexOf(value[value.length - 2]) >= 0
                ){
                    value = `${value}es`;
                }
                else {
                    value = `${value}s`;
                }
                break;
            case "possessive":
                if(mods.includes('s')) value = `${value}'`;
                else value = `${value}'s`;
                break;

            // Number Mods ------------------------------------------------------------------
            case "range":
                // Inclusive start and end
                const [start, end, step, pad] = value.split("_").map((x) => +x);
                // No idea why but when you roundUp end doesn't need the +1
                if (step) {
                    value = roundUp(
                        randomNext(start, end, tracery.getRng()),
                        step
                    ).toString();
                } else {
                    value = randomNext(start, end + 1, tracery.getRng()).toString();
                }
                if (pad) {
                    value = value.padStart(pad, "0");
                }
                break;
            case "ord":
                const num = parseInt(value, 10);
                if (isNaN(num)) {
                    break;
                }
                if (num >= 4 && num <= 20) {
                    value += "th";
                } else {
                    const ones = Math.floor(num % 10);
                    switch (ones) {
                        case 1:
                            value += "st";
                            break;
                        case 2:
                            value += "nd";
                            break;
                        case 3:
                            value += "rd";
                            break;
                        default:
                            value += "th";
                    }
                }
                break;
            case "num":
                const num1 = +value;
                value = num1.toLocaleString("en-US");
                break;
            case "count":
                value = `${valueList.length}`;
                break;

            // String filters ----------------------------------------------------------------
            case "replace":
                const [_, replace, replacement] = modItems;
                while(value.includes(replace)) {
                    value = value.replace(replace, replacement);
                }
                break;

            case "tmpl":
                const tmplName = modItems[1];
                const params = modItems.slice(2);
                const modString = getCustomMod(tmplName) ?? '';
                value = await tracery.replaceAsync(modString, new RegExp(regexString), async (match) => {
                    const groups = match.groups;
                    const key = groups['key'] as string;
                    const mod = groups['mod'] ?? '';
                    const def = groups['default'] ?? '';
                    const mods = mod.split('.').filter(x => x);

                    let toReturn = '';
                    if(key === 'str') {
                        toReturn = value;
                    } else {
                        toReturn = params[+key];
                    }
                    if(mods.length > 0) {
                        toReturn = await ModString(toReturn, [key], false, mods, tracery);
                    }

                    return toReturn || def;
                });
                break;

            case "forEach": {
                const [_, variable, key] = modItems;
                for(let v of valueList) {
                    tracery.addVariable(variable, v);
                    await tracery.ParseString(`#${key}#`);
                }
                value = `${valueList.length}`;
                break;
            }
            case "keyHandle":
                // Nothing to do here
                break;
            case "weight":
                // Nothing to do here
                break;
            default:
                console.log(`Unknown Mod: ${m}`);
                value = value;
                break;
        }
    }

    // If string has tooltip option, then wrap in html to display said tooltip
    //   if (customVars['tt'] !== undefined) {
    //     value = `<abbr title="${customVars['tt']}">${value}</abbr>`;
    //     delete customVars['tt'];
    //   }
    return value;
}

export function GetMod(mods: string[], key: string, defaultValue: string) {
    let modWeight = mods.find(x => x.startsWith(key+'_'));
    if(modWeight) {
        return modWeight.split('_').pop() || defaultValue;
    }
    return defaultValue;
}