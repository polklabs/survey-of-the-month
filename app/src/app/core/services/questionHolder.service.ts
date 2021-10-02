import { Injectable } from '@angular/core';
import { Question } from 'src/app/shared/model/question.model';

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
