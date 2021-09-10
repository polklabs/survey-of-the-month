export type AnswerType = 'text' | 'multi' | 'check' | 'rank' | 'date' | 'time' | 'scale' | 'slider';
import { v4 as guid } from 'uuid';

export class Question {
    questionId: string = guid();
    questionOrigin: number = -1; // Used to determine if question is custom
    text: string = '';
    seed: string = '';

    // Choice/Answer
    answerType: AnswerType = 'text';
    choices: string[] = ['Answer'];
    scaleValues: string[] = [];
    answerKey: string = '';    
    answerCount: number = 0;    
    allowOther: boolean = true;    
}