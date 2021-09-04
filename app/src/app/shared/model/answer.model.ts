import { v4 as guid } from 'uuid';

export class Answer {
    _id: string = guid();
    _rev?: string;
    answers: { questionId: string, value: null | any }[] = [];
}