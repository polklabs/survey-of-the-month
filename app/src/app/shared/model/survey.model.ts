import { Question } from './question.model';

export class Survey {
    name = 'Survey';
    subtitle = '';
    email = '';
    emailSent = false;
    lastModifiedDate: string = new Date().toISOString();
    questions: Question[] = [];
    users: { name: string, _id: string }[] = [];
}
