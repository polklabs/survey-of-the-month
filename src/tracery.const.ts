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
export const reservedKeys = ["type", "key", "count", "other", "tag", "format", "tt"]; // Used for question formatting, do not use as keys in grammar - #key#, tt = tooltip

export const holidays = {
  "Valentine's Day": "",
  "St. Patrick's Day": "",
  "Easter Sunday": "Easter",
  "Mother's Day": "",
  "Father's Day": "",
  "Independence Day": "The Fourth Of July",
  "Halloween": "",
  "Thanksgiving Day": "Thanksgiving",
  "Christmas Day": "Christmas",
  "New Year's Eve": "New Year's",
};

// Regular Expressions
export const regexVariable = /\[(?<key>[a-zA-Z0-9_]+):(?<value>.+?)\]/gm; // [key:value] -> key, value
export const regexString =
  /(#(?<key>([a-zA-Z0-9_]+|[*]))\.?(?<mod>[a-zA-Z0-9_.]*?)#)/gm; // #key#, #key.s#, #*#
export const regexInlineChoiceGroup = /\^\$(?<choices>.+?)(?<=[^\\])\$/gm; // ^$first:second$ -> first:second
export const regexInlineChoices = /(?<=[^\\]|^):/gm; // first:second -> ["first", "second"]
