import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { AnalyticsService } from 'src/app/core/services/analytics.service';
import { HelperService } from 'src/app/core/services/helperService.service';
import { CsvExportService } from '../../core/services/csvExport.service';
import { DataService } from '../../core/services/data.service';
import { DialogService } from '../../core/services/dialog.service';
import { LocalStorageService } from '../../core/services/local-storage.service';
import { AnswerStatus } from '../../shared/model/answer.model';
import { APIData } from '../../shared/model/api-data.model';
import { AnswerType } from '../../shared/model/question.model';
import { SurveyContainer } from '../../shared/model/survey-container.model';
import { Survey } from '../../shared/model/survey.model';

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
        private router: Router,
        private localStorageService: LocalStorageService,
        private dialogService: DialogService,
        private sanitizer: DomSanitizer,
        private analytics: AnalyticsService
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
                    this.dialogService.confirm(`Could not find survey: ${data.error!.body.reason}\n\nDo you want to remove this survey from the survey dropdown?`).subscribe(
                        ok =>  {
                            if (ok) {
                                this.localStorageService.delSurvey(this.id);
                            }
                            this.router.navigateByUrl('/home');
                        }
                    );
                } else if (data.error!.code === 'KEY') {
                    this.dialogService.confirm(`The url you entered is Incorrect\n\nDo you want to remove this survey from the survey dropdown?`).subscribe(
                        ok =>  {
                            if (ok) {
                                this.localStorageService.delSurvey(this.id);
                            }
                            this.router.navigateByUrl('/home');
                        }
                    );
                } else {
                    this.dialogService.error(data.error).subscribe(
                        () => this.router.navigateByUrl('/home')
                    );
                }
                this.initNew();
            }
        });
    }

    startResultsRequireKey(requireKey: boolean): void {
        this.dialogService.confirm('Anyone with a Sharable Link will be able to view all results/answers. You can reverse this decision later if you choose. Release?', 'Are you sure?').subscribe(
            ok => {
                if (ok) {
                    this.saveResultsRequireKey(requireKey);
                }
            }
        );
    }
    saveResultsRequireKey(requireKey: boolean): void {
        this.analytics.triggerEvent('ManagerQ', 'Release Answers', 'Allow All Users To View Answers');
        const [result, _] = this.dataService.putData('release', { requireKey, id: this.id, key: this.key });
        result.subscribe((data: { ok: boolean, id?: string, key?: string, error?: any }) => {
            if (data.ok) {
                this.surveyContainer!.resultsRequireKey = requireKey;
            } else if (!data.ok) {
                this.dialogService.error(data.error);
            }
        });
    }
    resultsRequireKey(): boolean {
        return this.surveyContainer?.resultsRequireKey ?? true;
    }

    getAnswerStatus(): void {
        const [result, _] = this.dataService.getData(`answer-status?id=${this.id}`);
        result.subscribe((data: APIData) => {
            this.answerStatus = data.data ?? [];
            this.answerStatus.sort((a, b) => a.name.localeCompare(b.name));
        });
    }

    deleteButton(): void {
        this.analytics.triggerEvent('MakerQ', 'SurveyDelete', 'Delete Survey Button');
        this.dialogService.confirm('Are you sure you want to delete this survey? This cannot be undone.').subscribe(
            del => {
                if (del) {
                    const [result, _] = this.dataService.deleteData(`survey?id=${this.id}&key=${this.key}`);
                    result.subscribe((data: APIData) => {
                        if (data.ok) {
                            this.localStorageService.delSurvey(this.id);
                            this.snackBar.open('Deleted', 'OK', { duration: 3000 });
                            this.router.navigateByUrl('/home');
                        } else {
                            this.dialogService.error(data.error).subscribe(
                                () => this.router.navigateByUrl('/home')
                            );
                        }
                    });
                }
            }
        );
    }

    copyLink(link: string, managerLink: boolean): void {
        this.analytics.triggerEvent('MakerQ', 'SurveyShare', 'Copy Share Link Button');
        if (managerLink) {
            this.dialogService.alert('This is the management link. If you share it with other\'s they will have the ability to edit and delete this survey.');
        }
        navigator.clipboard.writeText(link);
        this.snackBar.open('Copied', 'OK', { duration: 3000 });
    }

    getSurveyName(): string {
        return this.surveyContainer?.survey.name ?? '{Unknown}';
    }

    // Survey Presentation -----------------------------------------------------

    beginPresentation(): void {
        if (this.getTotalStatus() < 1) {
            this.dialogService.confirm(
                'Not everyone has completed the survey. Are you sure you want to begin the final presentation?'
            ).subscribe(
                result => {
                    if (result) {
                        if (this.surveyContainer?.resultsRequireKey ?? true) {
                            this.router.navigateByUrl(`/results/${this.id}/${this.key}`);
                        } else {
                            this.router.navigateByUrl(`/results/${this.id}`);
                        }
                    }
                }
            );
        } else {
            if (this.surveyContainer?.resultsRequireKey ?? true) {
                this.router.navigateByUrl(`/results/${this.id}/${this.key}`);
            } else {
                this.router.navigateByUrl(`/results/${this.id}`);
            }
        }
    }


    // Survey Completion -------------------------------------------------------
    getTotalStatus(): number {
        let total = this.surveyContainer?.survey.questions.length ?? 0;
        total *= this.surveyContainer?.survey.users.length ?? 0;

        let sum = 0;
        this.answerStatus?.forEach(x => sum += x.count);

        if (total === 0) { return 0; }
        return sum / total;
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

    answerTypeToString(answerType: AnswerType): string {
        return HelperService.getAnswerTypeText(answerType);
    }

    getQuestionSubstring(text: string): string {
        if (!text) { return ''; }
        if (text.length <= 25) { return text; }
        return text.substr(0, 24) + '…';
    }

    openFeedback(): void {
        this.dialogService.feedback();
    }

}
