export class Answer {
    userId!: string;
    createdDate: string = new Date().toUTCString();
    lastModifiedDate: string = new Date().toUTCString();
    answers: { questionId: string, value: null | any }[] = [];
}