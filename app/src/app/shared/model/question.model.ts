export type AnswerType = 'text' | 'multi' | 'check' | 'rank' | 'date' | 'time' | 'scale' | 'madlib';
import { v4 as guid } from 'uuid';

export class Question {
    questionId = guid();
    questionOrigin = -1;
    text = '';
    useAnswerFormat = false;
    answerFormat = '{0}'; // How to format the answer. Useful for mad-lib style questions
    seed = '';
    custom = true;
    vars: any = {};
    qChance = 1; // Chance of a question being displayed

    // Choice/Answer
    answerType: AnswerType = 'text';
    choices = ['Answer'];
    scaleValues = ['1', '2', '3', '4', '5'];
    answerKey = 'answer';
    answerKeys: string[] = [];
    answerCount = 1;
    otherOptionAllow = true;
    otherOptionText = 'Other';
}
