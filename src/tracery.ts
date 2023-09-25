import { setSeed, randomNext, isNumber, random } from "./tracery.math";
import { GetMod, ModString } from "./tracery.mod";
import {
    AnswerType,
    Question,
} from "../app/src/app/shared/model/question.model";
import { grammar, grammarKeys } from "./tracery.load";
import {
    regexCondition,
    regexInlineChoiceGroup,
    regexInlineChoices,
    regexMods,
    regexString,
    regexVariable,
} from "./tracery.const";
import { monthNow, nextHoliday, yearNow } from "./tracery.custom";

export class Tracery {
    private vars: { [key: string]: string | string[] } = {};
    private seen: { [key: string]: boolean[] } = {};
    private rng: any;
    private defaultUnknownKeyHandling: "delete" | "keep" | "unknown" = "keep";
    private defaultWeight = "more_options";
    private shuffleQuestion = false;
    private typeFilter?: AnswerType;
    filterTags?: string[]; // Do not include any item with tags in this list
    private chance = 1;

    private question: Question = new Question();

    constructor(
        people: string[] = [],
        customSeed = "",
        questionOrigin = -1,
        typeFilter?: AnswerType,
        filterTags?: string[]
    ) {
        this.vars["monthNow"] = monthNow();
        this.vars["yearNow"] = yearNow();
        this.vars["nextHoliday"] = nextHoliday();

        this.seen = {};
        this.question.questionOrigin = questionOrigin;
        this.vars["person"] = people.map((x) => `[isPerson:true]${x}`);

        if (questionOrigin !== -1) {
            this.shuffleQuestion = true;
            [this.rng, this.question.seed] = setSeed("");
            this.question.seed = customSeed ?? "";
        } else {
            [this.rng, this.question.seed] = setSeed(customSeed);
        }

        this.typeFilter = typeFilter;
        this.filterTags = filterTags;
    }

    /**
     * If a variable key ends with '$', the '$' will be removed and the data will be split on ','
     * @param vars Dictionary of variables to add
     */
    addVariables(vars: {
        [key: string]: string | string[] | { [key: string]: string };
    }) {
        this.vars = Object.assign(this.vars, vars);
        const keys = Object.keys(this.vars);

        // Flatten objects
        keys.forEach((k) => {
            const v = this.vars[k] as any;
            if (
                typeof v !== "string" &&
                !(v instanceof String) &&
                !Array.isArray(v)
            ) {
                let innerData = Object.keys(v);
                innerData = innerData.map((k) => `[${k}:${v[k]}]`);
                this.vars[k] = innerData.join("");
            }
        });

        // Spread CSV
        keys.forEach((k) => {
            if (k.endsWith("$")) {
                const newK = k.slice(0, k.length - 1);
                this.vars[newK] = (this.vars[k] as string)
                    .split(",")
                    .map((x) => x.trim());
            }
        });
    }

    addVariable(key: string, value: string | string[]): string | string[] {
        this.vars[key] = value;
        return this.vars[key];
    }

    setDefaultWeight(weight?: string): void {
        this.defaultWeight = weight ?? this.defaultWeight;
    }

    setUnknownKeyHandling(keyHandling?: "delete" | "keep" | "unknown"): void {
        this.defaultUnknownKeyHandling =
            keyHandling ?? this.defaultUnknownKeyHandling;
    }

    getRng(): any {
        return this.rng;
    }

    async start(origin = "question") {
        if (grammar["test!"] !== undefined) {
            origin = "test!";
        }

        this.question.text = "";
        this.question.choices = [];
        this.question.answerKey = "answer";
        this.question.answerType = "text";
        this.question.answerCount = 1;
        this.question.scaleValues = ["1", "2", "3", "4", "5"];
        this.question.otherOptionAllow = true;
        this.question.custom = false;
        this.question.vars = {};
        this.question.aTags = [];
        this.question.qTags = [];

        await this.generateQuestion(origin);
        await this.generateAnswer();
    }

    saveTags(question: boolean): void {
        if (this.question.vars["tag"] !== undefined) {
            if (question === true) {
                this.question.qTags.push(
                    ...this.question.vars["tag"].split(",")
                );
                this.question.qTags = [...new Set(this.question.qTags)];
            } else {
                this.question.aTags.push(
                    ...this.question.vars["tag"].split(",")
                );
                this.question.aTags = [...new Set(this.question.aTags)];
            }
        }
    }

    async simpleStart(origin: string) {
        this.question.vars = {};
        const [list, isEmpty] = this.GetKeyList(origin, this.defaultUnknownKeyHandling);
        return (await this.ParseKey(origin, list, [], true)).trim();
    }

    getQuestion(): Question {
        return this.question;
    }

    setQuestion(q: Question): void {
        this.question = q;
    }

    async generateQuestion(origin: string) {
        this.question.qTags = [];
        this.chance = 1;
        const [list, isEmpty] = this.GetKeyList(origin, this.defaultUnknownKeyHandling);
        this.question.text = await this.ParseKey(origin, list, [], true);
        this.saveTags(true);

        // We don't need to save this
        delete this.question.vars["tag"];

        // Get the question type
        if (this.question.vars["type"] !== undefined) {
            const answerType = this.question.vars["type"];
            this.question.answerType =
                answerType === "madlib" ? "text" : answerType;
            delete this.question.vars["type"];
        }

        // Get answer format for madlib style questions
        if (this.question.vars["format"] !== undefined) {
            this.question.answerFormat = this.question.vars["format"];
            this.question.useAnswerFormat = true;
            delete this.question.vars["format"];
        }

        // Get if other options are allowed
        if (this.question.vars["other"] !== undefined) {
            this.question.otherOptionAllow =
                this.question.vars["other"].toLowerCase() === "true";
            delete this.question.vars["other"];
        }

        // Get the answer key choices
        if (this.question.vars["key"] !== undefined) {
            this.question.answerKey = this.question.vars["key"];
            delete this.question.vars["key"];

            let fixedCount = false;
            if (this.question.vars["count"] !== undefined) {
                fixedCount = true;
                this.question.answerCount = parseInt(
                    this.question.vars["count"],
                    10
                );
                delete this.question.vars["count"];
                if (isNaN(this.question.answerCount)) {
                    fixedCount = false;
                    this.question.answerCount = 1;
                }
            }
            if (this.question.answerCount === 1 && fixedCount === false) {
                this.question.answerCount = randomNext(4, 8, this.rng);
            }
            this.question.answerKeys = this.question.answerKey.split(",");
            this.chance *= this.question.answerKeys.length;
            this.question.answerKey =
                this.question.answerKeys[
                    randomNext(0, this.question.answerKeys.length, this.rng)
                ];
        }

        if (this.question.vars["isPerson"] !== undefined) {
            this.question.includesPerson = true;
            delete this.question.vars["isPerson"];
        }

        // Get final calculated question probability
        this.question.qChance = this.chance;
    }

    async generateAnswer(index = -1) {
        this.question.aTags = [];
        if (this.question.answerCount === 0) {
            this.question.choices = ["Answer"];
            return;
        }

        if (index === -1) {
            // Generate All Answers
            this.question.choices = [];
            if (this.question.answerCount === -1) {
                let allAnswers: string[] =
                    grammar[this.question.answerKey] ??
                    this.vars[this.question.answerKey] ??
                    [];
                await Promise.all(
                    allAnswers.map(async (a) => {
                        let choice = await ModString(
                            await this.ParseString(a),
                            [],
                            true,
                            ["capitalize"],
                            this
                        );
                        this.question.choices.push(choice);
                        this.saveTags(false);
                    })
                );
            } else {
                for (let i = 0; i < this.question.answerCount; i++) {
                    this.question.choices.push(
                        await this.ParseString(
                            `#${this.question.answerKey}.capitalize#`
                        )
                    );
                    this.saveTags(false);
                }
            }
        } else {
            // Generate Specific Answer
            this.question.choices[index] = await this.ParseString(
                `#${this.question.answerKey}.capitalize#`
            );
            this.saveTags(false);
        }

        if (this.question.vars["isPerson"] !== undefined) {
            this.question.includesPerson = true;
            delete this.question.vars["isPerson"];
        }

        // We don't need to save this
        delete this.question.vars["tag"];
    }

    async ParseString(str: string, isOrigin = false) {
        str = await this.ParseCondition(str); // "[#count#>10]..."
        str = await this.ParseInlineChoice(str); // "... ^$option1:option2$ ..."
        str = await this.ParseVariable(str); // "[test:#animal#]..."
        str = await this.ParseKeyMod(str, isOrigin); // "... #data.a|default# ..."
        str = await this.ParseExtraMods(str); // "#.possessive#..."
        return str;
    }

    // Theres probably a better way to do this while allowing $ and : in the text
    private async ParseInlineChoice(str: string) {
        // Look for all text between ^$ and $
        return await this.replaceAsync(
            str,
            new RegExp(regexInlineChoiceGroup),
            async (match) => {
                const groups = match.groups;
                let choiceGroup: string = groups?.["choices"] ?? "";
                choiceGroup = choiceGroup.replace(/\\\$/g, "$"); // Fixed escaped $ character

                let choices: string[] = choiceGroup.split(regexInlineChoices);
                choices = choices.map((s) => s.replace(/\\:/g, ":"));

                this.chance *= choices.length || 1;
                const toReturn = await this.ParseString(
                    choices[randomNext(0, choices.length, this.rng)]
                );
                return toReturn;
            }
        );
    }

    private async ParseVariable(str: string) {
        return await this.replaceAsync(
            str,
            new RegExp(regexVariable),
            async (match) => {
                const groups = match.groups;
                const key = groups?.["key"] ?? "";
                const val = groups?.["value"] ?? "";

                let variable = await this.ParseString(val);
                this.question.vars[key] = variable;
                return "";
            }
        );
    }

    private async ParseKeyMod(str: string, isOrigin: boolean) {
        return await this.replaceAsync(
            str,
            new RegExp(regexString),
            async (match) => {
                const groups = match.groups;
                const key = groups["key"] as string;
                const mod = groups["mod"] ?? "";
                const def = groups["default"] ?? "";
                const mods = mod.split(".").filter((x) => x);

                let unknownKeyHandling = GetMod(
                    mods,
                    "keyHandle",
                    this.defaultUnknownKeyHandling
                );

                const [list, isEmpty] = this.GetKeyList(
                    key,
                    unknownKeyHandling
                );
                let toReturn = await this.ParseKey(key, list, mods, isOrigin);

                if (mods.length > 0) {
                    toReturn = await ModString(
                        toReturn,
                        list,
                        isEmpty,
                        mods,
                        this
                    );
                } else if (isEmpty && def) {
                    // If we don't have any data, no matter what the unknownKeyHandling is, default takes priority
                    return def;
                }

                return toReturn || def;
            }
        );
    }

    /**
     * "[#audience_rating#>80|#show_rating_average#][#audience_rating#>70|#show_rating_low#]#show_rating_high#"
     * If audience_rating > 80 then show_rating_high elseif audience_rating > 70 then show_rating_average else show_rating_low
     *
     * "[#audience_rating#>80|#show_rating_low#]#show_rating_high#"
     * If audience_rating > 80 then show_rating_high else show_rating_low
     * @param str
     * @returns
     */
    private async ParseCondition(str: string) {
        let outputOverride: string | undefined;
        let output = await this.replaceAsync(
            str,
            new RegExp(regexCondition),
            async (match) => {
                const groups = match.groups;
                let value1: string = groups?.["value1"] ?? "";
                let value2: string = groups?.["value2"] ?? "";
                const op: "!=" | ">=" | "<=" | ">" | "<" | "=" =
                    groups?.["op"] ?? "=";
                const el: string = groups?.["else"] ?? "";

                value1 = await this.ParseString(value1);
                value2 = await this.ParseString(value2);

                const bothNumbers = isNumber(value1) && isNumber(value2);

                switch (op) {
                    case ">=":
                        if (bothNumbers) {
                            if (Number(value1) >= Number(value2)) {
                                break;
                            }
                        } else if (value1 >= value2) {
                            break;
                        }
                        outputOverride = el;
                        break;
                    case "<=":
                        if (bothNumbers) {
                            if (Number(value1) <= Number(value2)) {
                                break;
                            }
                        } else if (value1 <= value2) {
                            break;
                        }
                        outputOverride = el;
                        break;
                    case ">":
                        if (bothNumbers) {
                            if (Number(value1) > Number(value2)) {
                                break;
                            }
                        } else if (value1 > value2) {
                            break;
                        }
                        outputOverride = el;
                        break;
                    case "<":
                        if (bothNumbers) {
                            if (Number(value1) < Number(value2)) {
                                break;
                            }
                        } else if (value1 < value2) {
                            break;
                        }
                        outputOverride = el;
                        break;
                    case "!=":
                        if (bothNumbers) {
                            if (Number(value1) !== Number(value2)) {
                                break;
                            }
                        } else if (value1 !== value2) {
                            break;
                        }
                        outputOverride = el;
                        break;
                    case "=":
                        if (bothNumbers) {
                            if (Number(value1) === Number(value2)) {
                                break;
                            }
                        } else if (value1 === value2) {
                            break;
                        }
                        outputOverride = el;
                        break;
                }
                return "";
            }
        );
        if (outputOverride !== undefined) {
            return outputOverride;
        }
        return output;
    }

    private async ParseExtraMods(str: string) {
        let mods = [];
        str = await this.replaceAsync(
            str,
            new RegExp(regexMods),
            async (match) => {
                const groups = match.groups;
                const mod = groups?.["mod"] ?? "";
                mods = mods.concat(mod.split("."));
                return Promise.resolve("");
            }
        );
        str = await ModString(str, [], true, mods, this);
        return str;
    }

    private async ParseKey(
        key: string,
        list: string[],
        mods: string[],
        isOrigin: boolean
    ) {
        if (this.question.vars[key] !== undefined) {
            return this.question.vars[key];
        }

        let weight = GetMod(mods, "weight", this.defaultWeight);

        // Make sure there is a valid seen list
        // Variables can overwrite others so reset if length changes or if all values have already been seen
        if (
            this.seen[key] === undefined ||
            list.length !== this.seen[key].length ||
            this.seen[key].every((x) => x === true)
        ) {
            this.seen[key] = new Array<boolean>(list.length).fill(false);
        }

        var choice = this.GetRandom(list, key, weight, isOrigin);

        // Make sure we get a unique value when possible
        while (this.seen[key][choice[1]] === true) {
            choice[1] = (choice[1] + 1) % list.length;
            choice[0] = list[choice[1]];
        }
        this.seen[key][choice[1]] = true;

        var value = await this.ParseString(choice[0]);
        return value;
    }

    private GetRandom(
        options: string[],
        key: string,
        weightType: string,
        isOrigin: boolean
    ): [string, number] {
        let value = 0;

        const filteredList = options.filter((str) => {
            let m;
            const regex = new RegExp(regexVariable);
            while ((m = regex.exec(str)) !== null) {
                if (m.index === regexVariable.lastIndex) {
                    regexVariable.lastIndex++;
                }

                const filterKey: string = m.groups["key"] ?? "";
                const filterValue: string = m.groups["value"] ?? "";

                // Filter out tags
                if (filterKey === "tag") {
                    const tags = filterValue.split(",");
                    for (let f of tags) {
                        if (this.filterTags?.includes(f) ?? false) {
                            return false;
                        }
                    }
                }

                // Filter out specific question types
                if (isOrigin && this.typeFilter) {
                    if (
                        filterKey === "type" &&
                        filterValue !== this.typeFilter
                    ) {
                        return false;
                    }
                }
            }
            return true;
        });

        this.chance *= filteredList.length || 1;

        switch (weightType) {
            case "more_options":
                // Apply a weight to each option
                // Choose random from weighted list
                const weights = this.CalculateWeights(filteredList);
                const max = weights[weights.length - 1]; // Get largest weight
                value = randomNext(0, max + 1, this.rng); // Choose random value
                value = weights.findIndex((x) => x >= value); // Map random value back to list index
                value = options.findIndex(
                    (x: string) => x === filteredList[value]
                ); // Get dict index
                // ----------------------------------------------------------------
                break;
            case "start":
                value = Math.floor(
                    Math.pow(random(this.rng), 2) * filteredList.length
                );
                value = options.findIndex(
                    (x: string) => x === filteredList[value]
                ); // Get dict index
                break;
            default:
                value = randomNext(0, filteredList.length, this.rng);
                value = options.findIndex(
                    (x: string) => x === filteredList[value]
                ); // Get dict index
                break;
        }

        if (isOrigin && this.question.questionOrigin !== -1) {
            return [
                options[this.question.questionOrigin],
                this.question.questionOrigin,
            ];
        }
        if (isOrigin) {
            this.question.questionOrigin = value;
        }

        return value === -1 ? [key, 0] : [options[value], value];
    }

    // Some string are more common and have less variety
    // Solution:
    // Before selecting a random option get a list of all possible options 1 level deep. Then if an option has a #key# or ^$choiceA:choiceB$, give it a higher weighting in the random chance.
    // The more keys/choices an option has, the higher it's weighted
    private CalculateWeights(inputs: string[]): number[] {
        let y = 0;
        return inputs
            .map((s) => {
                const r = s.match(regexString)?.length ?? 0;
                const cg = s.match(regexInlineChoiceGroup)?.length ?? 0;
                return 1 + 2 * r + 2 * cg;
            })
            .map((x) => (y += x));
    }

    /**
     * Gets the list mapped to this key
     * @param key
     * @param unknownKeyHandling
     * @returns [List of strings the key points to, Is the list empty] // Ignoring unknownKeyHandling
     */
    private GetKeyList(
        key: string,
        unknownKeyHandling: string
    ): [string[], boolean] {
        var list: string[] = grammar[key];

        if (this.vars[key] !== undefined) {
            if (Array.isArray(this.vars[key])) {
                list = this.vars[key] as string[];
            } else {
                list = [this.vars[key] as string];
            }
        }

        if (list === undefined) {
            switch (unknownKeyHandling) {
                case "delete":
                    return [[""], true];
                case "keep":
                    return [[key], true];
                case "unknown":
                    return [["(Unknown)"], true];
                default:
                    return [[key], true];
            }
        }

        return [list, false];
    }

    async replaceAsync(
        str: string,
        regex: RegExp,
        asyncFn: (match: any, ...args: any) => Promise<any>
    ) {
        let m;
        let toReturn = str;
        while ((m = regex.exec(str)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            const replacement = await asyncFn(m);
            toReturn = toReturn.replace(m[0], replacement);
        }
        return toReturn;
    }
}
