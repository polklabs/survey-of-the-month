import { Component, OnInit } from '@angular/core';
import { DataService } from '../core/services/data.service';
import { AnswerType, Question } from '../shared/model/question.model';
import { Survey } from '../shared/model/survey.model';
import { v4 as guid } from 'uuid';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { BehaviorSubject } from 'rxjs';

@Component({
    selector: 'app-survey-maker',
    templateUrl: './survey-maker.component.html',
    styleUrls: ['./survey-maker.component.scss']
})
export class SurveyMakerComponent implements OnInit {

    usersSelectable = true;
    usersRemovable = true;
    usersAddOnBlur = true;
    readonly separatorKeysCodes = [ENTER, COMMA] as const;

    users: string[] = ['Bob', 'Alice'];
    survey: Survey = new Survey();

    debounceButton = false;
    loading = false;

    constructor(
        private dataService: DataService
    ) { }

    ngOnInit(): void {
        this.survey = new Survey();
        this.getCachedUsers();
    }

    // Question --------------------------------------------------------------------------------------

    getQuestion(index = -1): void {
        this.callApi<Question>('question', { users: this.users })?.subscribe(data => {
            if (data !== null) {
                if (index === -1) {
                    this.survey.questions.push(data);
                } else {
                    this.survey.questions[index] = data;
                }
            }
        });
    }

    getAnswer(index = -1, choiceIndex = -1): void {
        this.callApi<Question>('choice', { question: this.survey.questions[index], users: this.users, choiceIndex })?.subscribe(
            data => {
                if (data !== null) {
                    this.survey.questions[index] = data;
                }
            }
        );
    }

    addQuestion(type: AnswerType): void {
        const question = new Question();
        question.answerType = type;
        this.survey.questions.push(question);
    }

    deleteQuestion(index: number): void {
        this.survey.questions.splice(index, 1);
    }

    // Survey -------------------------------------------------------------------------------------

    getSurvey(): void {
        const guid = '7ca19ebd-e1fc-4638-9c25-050f27cd30ac';
        const [result, progress] = this.dataService.getData('survey?id=' + guid);
        result.subscribe((data: { ok: boolean, data?: Survey, headers?: any, status?: any, error?: any }) => {
            if (data.ok) {
                this.survey = data.data!;
                console.log(this.survey);
            } else {
                console.log(data.error);
            }
        });
    }

    submitSurveyTest(): void {
        const [result, progress] = this.dataService.putData('survey', this.survey);
        result.subscribe((data: { ok: boolean, data?: any, headers?: any, status?: any, error?: any }) => {
            console.log(data);
        });
    }

    // Edit Users ------------------------------------------

    addUser(event: MatChipInputEvent): void {
        const input = event.input;
        const value = event.value;

        // Add our fruit
        if ((value || '').trim()) {
            this.users.push(value.trim());
        }

        // Reset the input value
        if (input) {
            input.value = '';
        }
        this.cacheUsers();
    }

    removeUser(user: string): void {
        const index = this.users.indexOf(user);

        if (index >= 0) {
            this.users.splice(index, 1);
        }
        this.cacheUsers();
    }

    cacheUsers(): void {
        localStorage.setItem('users', JSON.stringify(this.users));
        this.assignUsers();
    }

    getCachedUsers(): void {
        const usersString = localStorage.getItem('users');
        if (usersString !== null) {
            this.users = JSON.parse(usersString);
            this.assignUsers();
        }
    }

    assignUsers(): void {
        this.survey.users = this.users.map(x => { return { name: x, _id: guid() } });
    }

    // API ---------------------------------------------------------------------------
    callApi<T>(endpoint: string, data: any): BehaviorSubject<T | null> | null {
        if (this.debounceButton) return null;
        this.debounceButton = true;
        setTimeout(() => this.debounceButton = false, 750);

        const toReturn = new BehaviorSubject<T | null>(null);

        this.loading = true;
        const [result, progress] = this.dataService.postData(endpoint, data);
        setTimeout(() => {
            result.subscribe(data => {
                toReturn.next(data);
                toReturn.complete();
                this.loading = false;
            });
        }, 500);

        return toReturn;
    }

}
