import { QuestionInfo } from "./question-info.model";

export class Question {
    text: string = '';
    choices: string[] = [];
    info: QuestionInfo = new QuestionInfo();
}