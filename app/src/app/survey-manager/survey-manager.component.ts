import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { CsvExportService } from '../core/services/csvExport.service';
import { DataService } from '../core/services/data.service';
import { DialogService } from '../core/services/dialog.service';
import { LocalStorageService } from '../core/services/local-storage.service';
import { OkDialogComponent } from '../shared/modal/ok-dialog/ok-dialog.component';
import { AnswerStatus } from '../shared/model/answer.model';
import { APIData } from '../shared/model/api-data.model';
import { AnswerType } from '../shared/model/question.model';
import { SurveyContainer } from '../shared/model/survey-container.model';
import { Survey } from '../shared/model/survey.model';

@Component({
    selector: 'app-survey-manager',
    templateUrl: './survey-manager.component.html',
    styleUrls: ['./survey-manager.component.scss']
})
export class SurveyManagerComponent implements OnInit {

    id = '';
    key = '';
    surveyContainer?: SurveyContainer;
    answerStatus: AnswerStatus[] = [];
    hasData = false;

    displayedColumns: string[] = ['name', 'lastModifiedDate', 'status'];

    managerLink = '';
    shareLink = '';

    exportData: SafeResourceUrl = '';
    exportFilename = '';

    constructor(
        private csvExport: CsvExportService,
        private dataService: DataService,
        private activatedRoute: ActivatedRoute,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        private router: Router,
        private localStorageService: LocalStorageService,
        private dialogService: DialogService,
        private sanitizer: DomSanitizer
    ) { }

    ngOnInit(): void {
        this.activatedRoute.paramMap.subscribe(params => {
            this.id = params.get('id') ?? '';
            this.key = params.get('key') ?? '';
            if (this.id && this.id !== '0' && this.key && this.key !== '0') {
                this.getSurvey();
                this.shareLink = `${window.location.origin}/survey/${this.id}`;
                this.managerLink = window.location.toString();
            } else {
                this.initNew();
            }
        });
    }

    initNew(): void {
        this.hasData = false;
        this.surveyContainer = new SurveyContainer();
        this.surveyContainer.survey = new Survey();
        this.managerLink = '';
        this.shareLink = '';
    }

    getSurvey(): void {
        this.hasData = false;
        const [result, _] = this.dataService.getData(`survey-edit?id=${this.id}&key=${this.key}`);
        result.subscribe((data: APIData) => {
            if (data.ok) {
                if (data.data) {
                    this.surveyContainer = data.data;
                    if (!this.surveyContainer) { throw Error('Survey is undefined'); }
                    this.getAnswerStatus();

                    this.exportData = this.sanitizer.bypassSecurityTrustUrl(this.csvExport.export(this.surveyContainer));
                    this.exportFilename = this.csvExport.exportName(this.surveyContainer);

                    this.localStorageService.addSurvey(this.surveyContainer.survey.name, this.id, this.key);
                    this.hasData = true;
                }
            } else {
                if (data.error!.code === 'EDOCMISSING') {
                    this.dialogService.alert(`Could not find survey: ${data.error!.body.reason}`);
                    this.localStorageService.delSurvey(this.id);
                } else {
                    this.dialogService.alert(JSON.stringify(data.error));
                }
                this.router.navigateByUrl('/home');
                this.initNew();
            }
        });
    }

    getAnswerStatus(): void {
        const [result, _] = this.dataService.getData(`answer-status?id=${this.id}`);
        result.subscribe((data: APIData) => {
            this.answerStatus = data.data ?? [];
            this.answerStatus.sort((a, b) => a.name.localeCompare(b.name));
        });
    }

    deleteButton(): void {
        this.dialogService.confirm('Do you want to delete?').subscribe(
            del => {
                if (del) {
                    const [result, _] = this.dataService.deleteData(`survey?id=${this.id}&key=${this.key}`);
                    result.subscribe((data: APIData) => {
                        if (data.ok) {
                            this.localStorageService.delSurvey(this.id);
                            this.snackBar.open('Deleted', 'OK', {duration: 3000});
                            this.router.navigateByUrl('/home');
                        }
                    });
                }
            }
        );
    }

    copyLink(link: string): void {
        navigator.clipboard.writeText(link);
        this.snackBar.open('Copied', 'OK', { duration: 3000 });
    }

    getSurveyName(): string {
        return this.surveyContainer?.survey.name ?? '{Unknown}';
    }

    // Survey Presentation -----------------------------------------------------

    beginPresentation(): void {
        if (this.getTotalStatus() < 100) {
            this.dialogService.confirm(
                'Not everyone has completed the survey. Are you sure you want to begin the final presentation?'
                ).subscribe(
                result => {
                    if (result) {
                        console.log('Starting');
                    }
                }
            );
        } else {
            console.log('Starting');
        }
    }


    // Survey Completion -------------------------------------------------------
    getTotalStatus(): number {
        let total = this.surveyContainer?.survey.questions.length ?? 0;
        total *= this.surveyContainer?.survey.users.length ?? 0;

        let sum = 0;
        this.answerStatus?.forEach(x => sum += x.count);

        if (total === 0) { return 0; }
        return Math.round((sum / total) * 100);
    }

    getUsername(id: string): string {
        return this.surveyContainer?.survey.users.find(x => x._id === id)?.name ?? 'Unknown';
    }

    getStatus(count: number): string {
        const total = this.surveyContainer?.survey.questions.length ?? 0;
        if (count === 0) {
            return 'Not Started';
        }
        if (count < total) {
            return `${Math.round((count / total) * 100)}%`;
        }
        return 'Completed';
    }

    getStatusColor(count: number): string {
        const total = this.surveyContainer?.survey.questions.length ?? 0;
        if (count === 0) {
            return 'lightcoral';
        }
        if (count < total) {
            return `orange`;
        }
        return 'lime';
    }

    logError(error: string): void {
        const DIALOG_DATA = {data: {title: 'Error', content: `An error occurred while trying to perform action.\n\nError:\n${JSON.stringify(error)}\n\nPlease submit the issue through the feedback form in the header or on Github <a href="https://github.com/polklabs/survey-of-the-month/issues" target="_blank" rel="noreferrer">here</a>`}};
        this.dialog.open(OkDialogComponent, DIALOG_DATA);
    }

    answerTypeToString(answerType: AnswerType): string {
        switch (answerType) {
            case 'multi':
                return 'Multiple Choice';
            case 'text':
                return 'Free Answer';
            case 'check':
                return 'Check Boxes';
            case 'rank':
                return 'Rank the Following';
            case 'date':
                return 'Date Picker';
            case 'time':
                return 'Time Picker';
            case 'scale':
                return 'Rate the Following';
        }
        return answerType;
    }

    getQuestionSubstring(text: string): string {
        if (!text) { return ''; }
        if (text.length <= 25) { return text; }
        return text.substr(0, 24) + '...';
    }

}
