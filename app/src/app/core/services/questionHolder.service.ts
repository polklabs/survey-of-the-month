import { Injectable } from '@angular/core';
import { Question } from 'src/app/shared/model/question.model';

// This class is used for the button - 'Create survey from this question'
@Injectable({
    providedIn: 'root'
})
export class QuestionHolderService {

    question?: Question;

    saveQuestion(q: Question): void {
        this.question = q;
    }

    getQuestion(): Question | undefined {
        return this.question;
    }

}
