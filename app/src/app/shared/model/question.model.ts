export class Question {
    questionId: string = '';
    text: string = '';
    choices: string[] = [];
    answerKey: string = '';
    answerType: string = 'text';
    answerCount: number = 0;
    allowOther: boolean = true;
}