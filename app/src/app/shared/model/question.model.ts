export type AnswerType = 'text' | 'multi' | 'check' | 'rank' | 'date' | 'time' | 'scale' | 'slider';
import { v4 as guid } from 'uuid';

export class Question {
    questionId: string = guid();
    questionOrigin: number = -1;
    text: string = '';
    seed: string = '';
    custom: boolean = true;

    // Choice/Answer
    answerType: AnswerType = 'text';
    choices: string[] = ['Answer'];
    scaleValues: string[] = [];
    answerKey: string = 'answer';    
    answerCount: number = 1;
    allowOther: boolean = true;    
}