import { Answer } from './answer.model';
import { Survey } from './survey.model';
import { v4 as guid } from 'uuid';

export class SurveyContainer {
    _id: string = guid();
    _rev?: string;

    key!: string;
    createdDate: string = new Date().toISOString();
    lastModifiedDate: string = new Date().toISOString();
    resultsRequireKey = true;

    survey!: Survey;
    answers: Answer[] = [];
}
