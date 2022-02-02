import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { DataService } from '../core/services/data.service';
import { DialogService } from '../core/services/dialog.service';
import { Survey } from '../shared/model/survey.model';
import { Answer, AnswerStatus } from '../shared/model/answer.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { APIData } from '../shared/model/api-data.model';
import { SEOService } from '../core/services/seo.service';
import { CanComponentDeactivate } from '../shared/guard/can-deactivate-guard.service';

@Component({
    selector: 'app-survey-taker',
    templateUrl: './survey-taker.component.html',
    styleUrls: ['./survey-taker.component.scss']
})
export class SurveyTakerComponent implements OnInit, CanComponentDeactivate {

    id = '';
    name = '';
    survey?: Survey;
    answer = new Answer();
    answerStatus?: AnswerStatus[];
    isReleased = false;

    displayedColumns: string[] = ['name', 'lastModifiedDate', 'status', 'start'];

    loading = false;
    dirty = false;

    submitted = false;

    constructor(
        private dialogService: DialogService,
        private activatedRoute: ActivatedRoute,
        private dataService: DataService,
        private snackBar: MatSnackBar,
        private router: Router,
        private seoService: SEOService,
    ) { }

    @HostListener('window:beforeunload')
    canDeactivate(internalNavigation: true | undefined): Observable<boolean> | boolean {
        if (this.dirty) {
            if (internalNavigation === undefined) { return false; }
            return this.dialogService.confirm('Discard changes for Survey?');
        }
        return true;
    }

    ngOnInit(): void {
        this.seoService.updateTitle('Survey - Survey OTM');
        this.activatedRoute.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id && id !== '0') {
                this.id = id;
                this.getSurvey();
            } else {
                window.alert('No Survey!');
            }
        });
    }

    getSurvey(): void {
        this.loading = true;
        const [result, _] = this.dataService.getData(`survey?id=${this.id}`);
        result.subscribe((data: APIData) => {
            if (data.ok) {
                if (!data.data) { throw Error('Data is null'); }
                this.survey = data.data;
                this.seoService.updateTitle(`${this.survey?.name ?? 'Survey'} - Survey OTM`);
                this.getAnswerStatus();
                this.getReleaseStatus();
            } else {
                this.dialogService.error(data.error);
            }
            this.loading = false;
        });
    }

    getAnswerStatus(): void {
        const [result, _] = this.dataService.getData(`answer-status?id=${this.id}`);
        result.subscribe((data: APIData) => {
            if (data.ok) {
                this.answerStatus = data.data ?? [];
                this.answerStatus?.sort((a, b) => a.name.localeCompare(b.name));
            } else {
                this.dialogService.error(data.error);
            }
        });
    }

    getReleaseStatus(): void {
        const [result, _] = this.dataService.getData(`is-released?id=${this.id}`);
        result.subscribe((data: APIData) => {
            if (data.ok) {
                this.isReleased = data.data ?? false;
            } else {
                this.dialogService.error(data.error);
            }
        });
    }

    getStatus(count: number): string {
        const total = this.survey?.questions.length ?? 0;
        if (count === 0) {
            return 'Not Started';
        }
        if (count < total) {
            return `${Math.round((count / total) * 100)}%`;
        }
        return 'Completed';
    }

    getStatusColor(count: number): string {
        const total = this.survey?.questions.length ?? 0;
        if (count === 0) {
            return 'lightcoral';
        }
        if (count < total) {
            return `orange`;
        }
        return 'lime';
    }

    getStartButtonText(count: number): string {
        const total = this.survey?.questions.length ?? 0;
        if (count === 0) {
            return 'Start';
        }
        if (count < total) {
            return 'Continue';
        }
        return 'Update';
    }

    getStartButtonTextColor(count: number): string {
        const total = this.survey?.questions.length ?? 0;
        if (count === 0) {
            return 'primary';
        }
        if (count < total) {
            return 'accent';
        }
        return '';
    }

    selectUser(userId: string, name: string): void {
        this.dialogService.yesNo(`Once answers are submitted they will only be accessible by the survey manager. You can update your answers at a later date by returning to this page and submitting your answers again. Answers left blank will not overwrite previously submitted answers.\n\nAre you "${name}"?`).subscribe(
            ok => {
                if (ok) {
                    this.answer.userId = userId;
                    this.name = name;
                }
            }
        );
    }

    unSelectUser(): void {
        this.answer.userId = '';
        this.name = '';
    }

    updateAnswer(questionNumber: number, $event: (string | number | null)[] | null): void {
        if (!this.survey) { return; }

        const qId = this.survey.questions[questionNumber].questionId;
        const aIndex = this.answer.answers.findIndex(x => x.questionId === qId);
        if (aIndex === -1) {
            if ($event === null) {
                return;
            } else {
                this.answer.answers.push({ questionId: qId, value: $event, lastModifiedDate: new Date().toISOString() });
            }
        } else {
            if ($event === null) {
                this.answer.answers.splice(aIndex, 1);
            } else {
                this.answer.answers[aIndex].lastModifiedDate = new Date().toISOString();
                this.answer.answers[aIndex].value = $event;
            }
        }
        this.dirty = true;
    }

    getAnswerLastModified(qId: string): string {
        const a = this.answerStatus?.find(x => x.userId === this.answer.userId);
        if (!a) { return 'Not Yet Answered'; }

        const aStatus = a.answered.find(x => x.questionId === qId);
        if (!aStatus) { return 'Not Yet Answered'; }

        const date = new Date(aStatus.lastModifiedDate);

        return `Answered On: ${date.toLocaleString()}`;
    }

    disableSubmit(): boolean {
        return this.answer.answers.length <= 0 || this.loading;
    }

    startSubmit(): void {
        if (!this.survey) { return; }

        if (this.answer.answers.length < this.survey.questions.length) {
            this.submit('You have not answered all questions.\n\n');
        } else {
            this.submit();
        }
    }

    submit(extraText = ''): void {
        this.dialogService.yesNo(extraText + 'Once you submit you will not be able to view your answers. You can overwrite answers by submitting again later.\n\nSubmit?').subscribe(
            result => {
                if (result) {

                    this.loading = true;

                    const [dataResult, _] = this.dataService.putData('answer', { id: this.id, answers: this.answer });
                    dataResult.subscribe((data: APIData) => {
                        this.loading = false;
                        if (data.ok) {
                            this.snackBar.open('Saved!', 'OK', { duration: 3000 });
                            this.answer = new Answer();
                            this.getAnswerStatus();
                            this.dirty = false;
                        } else if (!data.ok) {
                            this.dialogService.error(data.error);
                        }
                        this.submitted = true;
                    });

                }
            }
        );
    }

    openFeedback(): void {
        this.dialogService.feedback();
    }

    beginPresentation(): void {
        this.router.navigateByUrl(`/results/${this.id}`);
    }
}
