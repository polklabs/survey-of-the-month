import { setSeed, randomNext } from "./tracery.math";
import { ModString } from "./tracery.mod";
import {
  AnswerType,
  Question,
} from "../app/src/app/shared/model/question.model";
import { grammar, grammarKeys } from "./tracery.load";
import {
  regexInlineChoiceGroup,
  regexInlineChoices,
  regexString,
  regexVariable,
} from "./tracery.const";
import { monthNow, nextHoliday, yearNow } from "./tracery.custom";

export class Tracery {
  customDict: { [key: string]: string[] } = {};
  seen: { [key: string]: Set<string> } = {};
  shuffleQuestion = false;
  typeFilter?: AnswerType;
  filterTags?: string[]; // Do not include any item with tags in this list
  rng: any;
  chance = 1;

  question: Question = new Question();

  constructor(
    people: string[] = [],
    customSeed = "",
    questionOrigin = -1,
    typeFilter?: AnswerType,
    filterTags?: string[]
  ) {
    this.customDict["monthNow"] = monthNow();
    this.customDict["yearNow"] = yearNow();
    this.customDict["nextHoliday"] = nextHoliday();

    this.seen = {};
    this.question.questionOrigin = questionOrigin;
    this.customDict["person"] = people.map(x => `[tag:person]${x}`);

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

  start(origin = "question") {
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

    this.generateQuestion(origin);
    this.generateAnswer();
  }

  saveTags(question: boolean): void {
    if (this.question.vars["tag"] !== undefined) {
      if (question === true) {
        this.question.qTags.push(...this.question.vars["tag"].split(","));
        this.question.qTags = [...new Set(this.question.qTags)];
      } else {
        this.question.aTags.push(...this.question.vars["tag"].split(","));
        this.question.aTags = [...new Set(this.question.aTags)];
      }
    }
  }

  simpleStart(origin: string) {
    this.question.vars = {};
    return this.ParseKey(origin);
  }

  getQuestion(): Question {
    return this.question;
  }

  setQuestion(q: Question): void {
    this.question = q;
  }

  generateQuestion(origin: string) {
    this.question.qTags = [];
    this.chance = 1;
    this.question.text = this.ParseKey(origin, true);
    this.saveTags(true);

    // We don't need to save this
    delete this.question.vars["tag"];

    // Get the question type
    if (this.question.vars["type"] !== undefined) {
      const answerType = this.question.vars["type"];
      this.question.answerType = answerType === "madlib" ? "text" : answerType;
      delete this.question.vars["type"];
      this;
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
        this.question.answerCount = parseInt(this.question.vars["count"], 10);
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

    // Get final calculated question probability
    this.question.qChance = this.chance;
  }

  generateAnswer(index = -1) {
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
          this.customDict[this.question.answerKey] ??
          [];
        allAnswers.forEach((a) => {
          let choice = ModString(this.ParseString(a), "capitalize", this.question.vars, this.rng);
          this.question.choices.push(choice);
          this.saveTags(false);
        });
      } else {
        for (let i = 0; i < this.question.answerCount; i++) {
          this.question.choices.push(
            this.ParseString(`#${this.question.answerKey}.capitalize#`)
          );
          this.saveTags(false);
        }
      }
    } else {
      // Generate Specific Answer
      this.question.choices[index] = this.ParseString(
        `#${this.question.answerKey}.capitalize#`
      );
      this.saveTags(false);
    }

    // We don't need to save this
    delete this.question.vars["tag"];
  }

  GetRandom(key: string, isOrigin = false): string {
    var dict = grammar[key] ? grammar : this.customDict;
    if (!dict[key] || dict[key].length === 0) return key;

    let value = 0;

    // Filtering -------------------------------------------------------
    const filteredList = dict[key].filter((str) => {
      let m;
      while ((m = regexVariable.exec(str)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
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
          if (filterKey === "type" && filterValue !== this.typeFilter) {
            return false;
          }
        }
      }
      return true;
    });

    this.chance *= filteredList.length || 1;
    // Apply a weight to each option
    // Choose random from weighted list
    const weights = this.CalculateWeights(filteredList);
    const max = weights[weights.length - 1]; // Get largest weight
    value = randomNext(0, max + 1, this.rng); // Choose random value
    value = weights.findIndex((x) => x >= value); // Map random value back to list index
    value = dict[key].findIndex((x: string) => x === filteredList[value]); // Get dict index
    // ----------------------------------------------------------------

    // Overwrite or use origin to regenerate the same question
    if (isOrigin && this.question.questionOrigin !== -1) {
      return dict[key][this.question.questionOrigin];
    }
    if (isOrigin) {
      this.question.questionOrigin = value;
    }

    return value === -1 ? key : dict[key][value];
  }

  // Theres probably a better way to do this while allowing $ and : in the text
  ParseInlineChoice(value: string) {
    // Look for all text between ^$ and $
    value = value.replace(
      new RegExp(regexInlineChoiceGroup),
      (...match: string[]) => {
        const groups = match.pop();
        let choiceGroup: string = groups?.["choices"] ?? "";
        choiceGroup = choiceGroup.replace(/\\\$/g, "$"); // Fixed escaped $ character

        let choices: string[] = choiceGroup.split(regexInlineChoices);
        choices = choices.map((s) => s.replace(/\\:/g, ":"));

        this.chance *= choices.length || 1;
        if (choices.length === 0) {
          return "";
        }
        return choices[randomNext(0, choices.length, this.rng)];
      }
    );
    return value;
  }

  ParseString(str: string) {
    str = this.ParseInlineChoice(str);

    str = str.replace(new RegExp(regexVariable), (...match: string[]) => {
      const groups = match.pop();
      const key = groups?.["key"] ?? "";
      const val = groups?.["value"] ?? "";

      let variable = this.ParseString(val);
      this.question.vars[key] = variable;
      return "";
    });

    str = str.replace(new RegExp(regexString), (...match: string[]) => {
      const groups = match.pop();
      const key = groups?.["key"] ?? "";
      const mod = groups?.["mod"] ?? "";

      let toReturn = this.ParseKey(key);
      if (mod || this.customDict['tt'] !== undefined) {
        toReturn = ModString(toReturn, mod, this.question.vars, this.rng);
      }

      return toReturn;
    });

    return str;
  }

  ParseKey(key: string, isOrigin = false) {
    // Handle wildcard key
    if (key === "*") {
      this.chance *= grammarKeys.length || 1;
      key = grammarKeys[randomNext(0, grammarKeys.length, this.rng)];
    }

    if (this.question.vars[key] !== undefined) {
      return this.question.vars[key];
    }

    var dict = grammar;
    if (dict[key] === undefined) dict = this.customDict;
    if (dict[key] === undefined) return key;

    // Make sure that we haven't already chosen this option
    var value = this.ParseString(this.GetRandom(key, isOrigin));
    // Make sure there is a valid string set
    if (this.seen[key] === undefined) {
      this.seen[key] = new Set();
    }

    // Only try again if we haven't seen all the keys in the list
    if (this.seen[key].size < dict[key].length) {
      let tries = 0; // Prevent infinite loops
      while (this.seen[key].has(value) && tries < dict[key].length * 2) {
        tries++;
        value = this.ParseString(this.GetRandom(key, isOrigin));
      }
      this.seen[key].add(value);
    } else {
      this.seen[key].clear();
    }

    return value;
  }

  // Some string are more common and have less variety
  // Solution:
  // Before selecting a random option get a list of all possible options 1 level deep. Then if an option has a #key# or ^$choiceA:choiceB$, give it a higher weighting in the random chance.
  // The more keys/choices an option has, the higher it's weighted
  CalculateWeights(inputs: string[]): number[] {
    let y = 0;
    return inputs
      .map((s) => {
        const r = s.match(regexString)?.length ?? 0;
        const cg = s.match(regexInlineChoiceGroup)?.length ?? 0;
        return 1 + 3 * r + 2 * cg;
      })
      .map((x) => (y += x));
  }
}
