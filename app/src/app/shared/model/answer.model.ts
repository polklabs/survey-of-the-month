import { v4 as guid } from 'uuid';

export class Answer {
    _id: string = guid();
    _rev?: string;
    surveyId: string = '';
    createdDate: string = new Date().toUTCString();
    lastModifiedDate: string = new Date().toUTCString();
    answers: { questionId: string, value: null | any }[] = [];
}