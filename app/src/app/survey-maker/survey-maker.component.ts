import { Component, OnInit } from '@angular/core';
import { DataService } from '../core/services/data.service';
import { Question } from '../shared/model/question.model';
import { Survey } from '../shared/model/survey.model';
import { v4 as guid } from 'uuid';

@Component({
    selector: 'app-survey-maker',
    templateUrl: './survey-maker.component.html',
    styleUrls: ['./survey-maker.component.scss']
})
export class SurveyMakerComponent implements OnInit {

    users: string[] = ['Kate', 'Madison', 'Shireen', 'Avah', 'Emma', 'Paulina', 'Jasmin'];
    survey: Survey = new Survey();

    constructor(
        private dataService: DataService
    ) { }

    ngOnInit(): void {

    }

    createSurveyTest(): void {
        this.survey = new Survey();
        this.survey.name = 'Test1';
        this.survey.users = this.users.map(x => { return { name: x, _id: guid() } });
        for (let i = 0; i < 10; i++) {
            this.getQuestion();
        }
    }

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

    getQuestion(): void {
        const [result, progress] = this.dataService.postData('question', { users: this.users });
        result.subscribe((data: Question) => {
            this.survey.questions.push(data);
        });
    }

    submitSurveyTest(): void {
        const [result, progress] = this.dataService.putData('survey', this.survey);
        result.subscribe((data: { ok: boolean, data?: any, headers?: any, status?: any, error?: any }) => {
            console.log(data);
        });
    }



}
