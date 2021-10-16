export const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const reservedKeys = ['type', 'key', 'count', 'other', 'tag', 'format']; // Used for question formatting, do not use as keys in grammar - #key#

// Regular Expressions
export const regexVariable = /\[(?<key>[a-zA-Z0-9_]+):(?<value>.+?)\]/gm; // [key:value] -> key, value
export const regexString = /(#(?<key>([a-zA-Z0-9_]+|[*]))\.?(?<mod>[a-zA-Z0-9_.]*?)#)/gm; // #key#, #key.s#, #*#
export const regexInlineChoiceGroup = /\^\$(?<choices>.+?)(?<=[^\\])\$/gm; // ^$first:second$ -> first:second
export const regexInlineChoices = /(?<=[^\\]|^):/gm; // first:second -> ["first", "second"]