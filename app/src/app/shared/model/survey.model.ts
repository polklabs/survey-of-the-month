import { Question } from './question.model';

export class Survey {
    name = 'Survey';
    subtitle = 'Thank you for taking the time to complete this survey. I hope you enjoy it!';
    email = '';
    emailSent = false;
    lastModifiedDate: string = new Date().toISOString();
    questions: Question[] = [];
    users: { name: string, _id: string }[] = [];
}
