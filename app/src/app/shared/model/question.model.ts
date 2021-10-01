export type AnswerType = 'text' | 'multi' | 'check' | 'rank' | 'date' | 'time' | 'scale';
import { v4 as guid } from 'uuid';

export class Question {
    questionId = guid();
    questionOrigin = -1;
    text = '';
    seed = '';
    custom = true;
    vars: any = {};

    // Choice/Answer
    answerType: AnswerType = 'text';
    choices = ['Answer'];
    scaleValues = ['1', '2', '3', '4', '5'];
    answerKey = 'answer';
    answerCount = 1;
    otherOptionAllow = true;
    otherOptionText = 'Other';
}
