import { Question } from './question.model';

export class Survey {
    name = 'Survey';

    // Custom Text Overrides
    preAnswer = 'Welcome to the Survey. I hope you enjoy it!';
    postAnswer = 'Thank you for taking the time to complete this survey!';
    resultsIntro = '<h2 class="center">Welcome to the survey results!</h2>';
    resultsPeople = '<h3 class="center">Let\'s meet the participants</h3>';
    resultsEnd = '<h2 class="center">The End!</h2>';

    email = '';
    emailSent = false;
    lastModifiedDate: string = new Date().toISOString();
    questions: Question[] = [];
    users: { name: string, _id: string }[] = [];
}
