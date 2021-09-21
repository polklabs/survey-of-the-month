import { Question } from "./question.model";

export class Survey {
    name: string = 'Survey';
    questions: Question[] = [];
    users: { name: string, _id: string }[] = [];
}