import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../core/services/data.service';
import { DialogService } from '../core/services/dialog.service';
import { HelperService } from '../core/services/helperService.service';
import { SEOService } from '../core/services/seo.service';
import { APIData } from '../shared/model/api-data.model';
import { Question } from '../shared/model/question.model';
import { SurveyContainer } from '../shared/model/survey-container.model';

@Component({
    selector: 'app-public-survey',
    templateUrl: './public-survey.component.html',
    styleUrls: ['./public-survey.component.scss'],
})
export class PublicSurveyComponent implements OnInit {
    surveyContainer!: SurveyContainer;

    constructor(
        private dataService: DataService,
        private seoService: SEOService,
        private dialogService: DialogService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.getSurvey();
    }

    getSurvey(): void {
        const [result, _] = this.dataService.getData(`public-survey`);
        result.subscribe((data: APIData) => {
            if (data.ok) {
                if (data.data) {
                    this.surveyContainer = data.data;
                    this.seoService.updateTitle(`${this.surveyContainer.survey.name} - Survey OTM`);
                    if (!this.surveyContainer) {
                        this.dialogService
                            .alert('Survey is undefined', 'Error')
                            .subscribe(() => this.router.navigateByUrl('/home'));
                        return;
                    }

                    console.log(this.surveyContainer);
                }
            } else {
                this.dialogService.error(data.error).subscribe(() => this.router.navigateByUrl('/home'));
            }
        });
    }

    getAnswer(question: Question): string[] {
        const answer = this.surveyContainer.answers[0].answers.find(x => x.questionId === question.questionId);
        return this.answerToString(question, answer?.value ?? [], 'Anon');
    }

    getAnswerDate(question: Question): string {
        return this.surveyContainer.answers[0].answers.find(x => x.questionId === question.questionId)?.lastModifiedDate ?? (new Date()).toISOString();
    }

    getAnswerTypeText(index: number): string {
        return HelperService.getAnswerTypeTextByIndex(this.surveyContainer, index);
    }

    answerToString(q: Question, answer: (null | string | number)[], username: string): string[] {
        if (q.useAnswerFormat) {
            return [HelperService.formatAnswer(q, answer, username)];
        }
        return HelperService.answerToString(q, answer);
    }
}
