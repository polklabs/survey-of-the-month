export const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];
export const reservedKeys = [
    "type",
    "key",
    "count",
    "other",
    "tag",
    "format",
    "tt",
    "isPerson",
]; // Used for question formatting, do not use as keys in grammar - #key#, tt = tooltip

export const holidays = {
    "Valentine's Day": "",
    "St. Patrick's Day": "",
    "Easter Sunday": "Easter",
    "Mother's Day": "",
    "Father's Day": "",
    "Independence Day": "The Fourth Of July",
    Halloween: "",
    "Thanksgiving Day": "Thanksgiving",
    "Christmas Day": "Christmas",
    "New Year's Eve": "New Year's",
};

// Regular Expressions ---------------------------------------------------------------------------------

// Variables
// [key:value] -> key, value
export const regexVariable = /\[(?<key>[a-zA-Z0-9_]+):(?<value>.+?)\]/gm; 

// Keys, Keys.mods
// #key#, #key.s#, #*#
export const regexString =
  /#(?<key>[a-zA-Z0-9_]+)\.?(?<mod>(?<=\.{1}).*?)?\|?(?<default>(?<=\|{1}).*?)?#/gm; 

// Inline choice
export const regexInlineChoiceGroup = /\^\$(?<choices>.*?(?<=[^\\]):.*?)(?<=[^\\])\$/gm; // ^$first:second$ -> first:second
export const regexInlineChoices = /(?<=[^\\]|^):/gm; // first:second -> ["first", "second"]

// Conditional
export const regexCondition =
  /\[(?<value1>.+?)(?<op>!=|>=|<=|<|>|=)(?<value2>.+?)(\|?(?<=\|)(?<else>.*?))?\]/gm;  // [#value#>50], > >= < <= = !=

// Extra Mods
export const regexMods = /#\.{1}(?<mod>.*?)#/gm; // #.mod1#, #.mod1.mod2#
