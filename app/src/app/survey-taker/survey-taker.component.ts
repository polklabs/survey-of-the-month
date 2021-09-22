import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { DataService } from '../core/services/data.service';
import { DialogService } from '../core/services/dialog.service';
import { Survey } from '../shared/model/survey.model';
import { Answer, AnswerStatus } from '../shared/model/answer.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-survey-taker',
    templateUrl: './survey-taker.component.html',
    styleUrls: ['./survey-taker.component.scss']
})
export class SurveyTakerComponent implements OnInit {

    id = '';
    name = '';
    survey?: Survey;
    answer = new Answer();
    answerStatus?: AnswerStatus[];

    displayedColumns: string[] = ['name', 'lastModifiedDate', 'status', 'start'];

    loading = false;
    dirty = false;

    constructor(
        private dialogService: DialogService,
        private activatedRoute: ActivatedRoute,
        private dataService: DataService,
        private snackBar: MatSnackBar,
        private router: Router,
    ) { }

    ngOnInit(): void {
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

    canDeactivate(): Observable<boolean> | boolean {
        if (this.dirty) {
            return this.dialogService.confirm('Discard changes for Survey?');
        }
        return true;
    }

    getSurvey(): void {
        this.loading = true;
        const [result, _] = this.dataService.getData(`survey?id=${this.id}`);
        result.subscribe((data: { ok: boolean, data?: Survey, error?: any }) => {
            if (data.ok) {
                this.survey = data.data!;
                this.getAnswerStatus();
            } else {
                this.dialogService.alert(`Error: ${JSON.stringify(data.error)}`);
            }
            this.loading = false;
        });
    }

    getAnswerStatus(): void {
        const [result, _] = this.dataService.getData(`answer-status?id=${this.id}`);
        result.subscribe((data: {ok: boolean, data?: AnswerStatus[]}) => {
            this.answerStatus = data.data ?? [];
            this.answerStatus.sort((a, b) => a.name.localeCompare(b.name));
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

    selectUser(userId: string, name: string): void {
        this.answer.userId = userId;
        this.name = name;
    }

    updateAnswer(questionNumber: number, $event: (string | number | null)[] | null): void {
        if (!this.survey) return;

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
    }

    getAnswerLastModified(qId: string): string {
        const a = this.answerStatus?.find(x => x.userId === this.answer.userId);
        if (!a) return 'Never';
        
        const aStatus = a.answered.find(x => x.questionId === qId);
        if (!aStatus) return 'Never';

        const date = new Date(aStatus.lastModifiedDate);

        return date.toLocaleString();
    }

    disableSubmit(): boolean {
        return this.answer.answers.length <= 0 || this.loading;
    }

    startSubmit(): void {
        if (!this.survey) return;

        if (this.answer.answers.length < this.survey.questions.length) {
            this.dialogService.confirm('You have not completed all question. Are you sure you want to submit?').subscribe(
                result => {
                    if (result) {
                        this.submit();
                    }
                }
            );
        } else {
            this.submit();
        }
    }

    submit(): void {
        this.dialogService.confirm('Once you submit you will not be able to view your answers until everyone has finished. You can resubmit answers later. Submit?').subscribe(
            result => {
                if (result) {

                    this.loading = true;

                    const [result, _] = this.dataService.putData('answer', { id: this.id, answers: this.answer });
                    result.subscribe((data: { ok: boolean, error?: any }) => {
                        this.loading = false;
                        if (data.ok) {
                            this.snackBar.open('Saved!', 'OK', { duration: 3000 });
                            this.answer = new Answer();
                        } else if (!data.ok) {
                            this.dialogService.alert(data.error ?? 'Unknown Error');
                        }

                    });

                }
            }
        )
    }
}
