import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../core/services/data.service';
import { DialogService } from '../core/services/dialog.service';
import { HelperService } from '../core/services/helperService.service';
import { SEOService } from '../core/services/seo.service';
import { APIData } from '../shared/model/api-data.model';
import { Question } from '../shared/model/question.model';
import { SurveyContainer } from '../shared/model/survey-container.model';
import { rarityColors, rarityValues } from '../shared/consts';

@Component({
    selector: 'app-public-survey',
    templateUrl: './public-survey.component.html',
    styleUrls: ['./public-survey.component.scss'],
})
export class PublicSurveyComponent implements OnInit {
    @ViewChild('formDefault', { static: true }) formDefault!: TemplateRef<any>;
    @ViewChild('formEmpty', { static: true }) formEmpty!: TemplateRef<any>;

    @ViewChild('formText', { static: true }) formText!: TemplateRef<any>;
    @ViewChild('formMulti', { static: true }) formMulti!: TemplateRef<any>;
    @ViewChild('formCheck', { static: true }) formCheck!: TemplateRef<any>;
    @ViewChild('formRank', { static: true }) formRank!: TemplateRef<any>;
    @ViewChild('formScale', { static: true }) formScale!: TemplateRef<any>;

    surveyContainer!: SurveyContainer;
    title = 'Public Survey';

    constructor(
        private dataService: DataService,
        private seoService: SEOService,
        private dialogService: DialogService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.getSurvey();
    }

    getAnswerTemplate(question: Question): TemplateRef<any> {
        switch (question.answerType) {
            case 'text':
                return this.formText;
            case 'multi':
                return this.formMulti;
            case 'rank':
                return this.formRank;
            case 'date':
                return this.formText;
            case 'check':
                return this.formCheck;
            case 'time':
                return this.formText;
            case 'scale':
                return this.formScale;
            default:
                return this.formDefault;
        }
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
                    this.surveyContainer.survey.questions.sort((a,b) => {
                        const answerA = this.surveyContainer.answers[0].answers.find(x => x.questionId === a.questionId);
                        const answerB = this.surveyContainer.answers[0].answers.find(x => x.questionId === b.questionId);

                        return answerB?.lastModifiedDate.localeCompare(answerA?.lastModifiedDate ?? '') ?? 0;
                    })
                }
            } else {
                this.dialogService.error(data.error).subscribe(() => this.router.navigateByUrl('/home'));
            }
        });
    }

    getAnswer(question: Question): (string|number|null)[] | undefined {
        const answer = this.surveyContainer.answers[0].answers.find(x => x.questionId === question.questionId);
        return answer?.value;
    }

    getAnswerFormatted(question: Question): string[] {
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

    isString(value: any): boolean {
        return typeof(value) === 'string';
    }

    getBorderStyle(question: Question): any {
        let color = 'gray';
        for (let i = 0; i < rarityValues.length; i++) {
            if (question.qChance < rarityValues[i]) {
                color = rarityColors[i];
                break;
            }
        }

        if (question.qChance > 1) {
            return { border: 'solid 2px ' + color };
        }
        return {};
    }
}
