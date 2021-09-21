import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../core/services/data.service';
import { DialogService } from '../core/services/dialog.service';
import { LocalStorageService } from '../core/services/local-storage.service';
import { OkDialogComponent } from '../shared/modal/ok-dialog/ok-dialog.component';
import { Survey } from '../shared/model/survey.model';

@Component({
    selector: 'app-survey-manager',
    templateUrl: './survey-manager.component.html',
    styleUrls: ['./survey-manager.component.scss']
})
export class SurveyManagerComponent implements OnInit {

    id: string = '';
    key: string = '';
    survey?: Survey;
    answerStatus?: { name: string, status: string, count: number }[];
    hasData = false;

    managerLink = '';
    shareLink = '';

    constructor(
        private dataService: DataService,
        private activatedRoute: ActivatedRoute,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        private router: Router,
        private localStorageService: LocalStorageService,
        private dialogService: DialogService
    ) { }

    ngOnInit(): void {
        this.activatedRoute.paramMap.subscribe(params => {
            this.id = params.get('id') ?? '';
            this.key = params.get('key') ?? '';
            if (this.id && this.id !== '0' && this.key && this.key !== '0') {
                this.getSurvey(this.id);
                this.shareLink = `${window.location.origin}/survey/${this.id}`;
                this.managerLink = window.location.toString();
            } else {
                this.hasData = false;
                this.survey = new Survey();
                this.managerLink = '';
                this.shareLink = '';
            }
        });
    }

    getSurvey(id: string): void {
        this.hasData = false;
        const [result, _] = this.dataService.getData(`survey-edit?id=${this.id}&key=${this.key}`);
        result.subscribe((data: { ok: boolean, data?: Survey, error?: any }) => {
            if (data.ok) {
                if (data.data) {
                    this.survey = data.data;
                    this.getAnswerStatus();

                    this.localStorageService.addSurvey(this.survey.name, this.id, this.key);
                    this.hasData = true;
                }
            } else {
                this.logError(data.error);
                this.survey = new Survey();
            }
        });
    }

    getAnswerStatus(): void {
        const [result, progress] = this.dataService.postData('answer-status', this.survey?.users.map(x => x._id) ?? []);
        result.subscribe((data: { id: string, count: number }[]) => {
            this.answerStatus = data.map(x => { return { name: this.getUsername(x.id), status: this.getStatus(x.count), count: x.count } });
            this.answerStatus.sort((a, b) => a.name.localeCompare(b.name));
        });
    }

    exportButton(): void {
        console.log('TODO');
    }

    deleteButton(): void {
        this.dialogService.confirm('Do you want to delete?').subscribe(
            del => {
                if (del) {
                    const [result, _] = this.dataService.deleteData(`survey?id=${this.id}&key=${this.key}`);
                    result.subscribe((data: { ok: boolean, error?: any }) => {
                        if (data.ok) {
                            this.localStorageService.delSurvey(this.id);
                            this.snackBar.open('Deleted', 'OK', {duration: 3000});
                            this.router.navigateByUrl('/home');
                        }
                    });
                }
            }
        )
    }

    copyLink(link: string): void {
        navigator.clipboard.writeText(link);
        this.snackBar.open('Copied', 'OK', { duration: 3000 });
    }


    // Survey Completion -------------------------------------------------------
    getTotalStatus(): string {
        let total = this.survey?.questions.length ?? 0;
        total *= this.survey?.users.length ?? 0;

        let sum = 0;
        this.answerStatus?.forEach(x => sum += x.count);

        if (total === 0) return '';
        return `${Math.round((sum / total) * 100)}%`;
    }

    getUsername(id: string): string {
        return this.survey?.users.find(x => x._id === id)?.name ?? 'Unknown';
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

    logError(error: string): void {
        const DIALOG_DATA = {data: {title: 'Error', content: `An error occurred while trying to perform action.\n\nError:\n${JSON.stringify(error)}\n\nPlease submit the issue through the feedback form in the header or on Github <a href="https://github.com/polklabs/survey-of-the-month/issues" target="_blank" rel="noreferrer">here</a>`}}
        this.dialog.open(OkDialogComponent, DIALOG_DATA);
    }

}
