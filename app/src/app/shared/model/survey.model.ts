import { Question } from "./question.model";
import { v4 as guid } from 'uuid';

export class Survey {
    _id: string = guid();
    _rev?: string;
    name: string = 'Survey';
    createdDate: string = new Date().toUTCString();
    lastModifiedDate: string = new Date().toUTCString();

    questions: Question[] = [];
    users: { name: string, _id: string }[] = [];
}