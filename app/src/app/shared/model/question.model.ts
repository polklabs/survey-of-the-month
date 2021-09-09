export type AnswerType = 'text' | 'multi' | 'check' | 'rank' | 'date' | 'time' | 'scale' | 'slider';

export class Question {
    questionId: string = '';
    questionOrigin: number = -1;
    text: string = '';
    seed: string = '';

    // Choice/Answer
    answerType: AnswerType = 'text';
    choices: string[] = [];
    scaleValues: string[] = [];
    answerKey: string = '';    
    answerCount: number = 0;    
    allowOther: boolean = true;    
}