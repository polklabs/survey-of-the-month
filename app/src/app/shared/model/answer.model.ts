export class Answer {
    userId!: string;
    lastModifiedDate: string = new Date().toISOString();
    answers: SingleAnswer[] = [];
}

export class SingleAnswer {
    questionId!: string;
    lastModifiedDate!: string;
    value!: null | any;
}

export class AnswerStatus {
    userId!: string;
    name!: string;
    count!: number;
    lastModifiedDate?: string;
    answered!: {
        questionId: string;
        lastModifiedDate: string;
    }[];
}
