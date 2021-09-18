import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../core/services/data.service';
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

    managerLink = '';
    shareLink = '';

    availableSurveys: string[][] = [];
    availableSurveyIndex?: number;

    constructor(
        private dataService: DataService,
        private activatedRoute: ActivatedRoute,
        private snackBar: MatSnackBar,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.getLocalIds();
        this.activatedRoute.paramMap.subscribe(params => {
            this.id = params.get('id') ?? '';
            this.key = params.get('key') ?? '';
            if (this.id && this.key) this.getSurvey(this.id);
            this.shareLink = `${window.location.origin}/survey/${this.id}/${this.key}`;
            this.managerLink = window.location.toString();
        });
    }

    getLocalIds(): void {
        const ids = localStorage.getItem('Surveys');
        if (ids) {
            this.availableSurveys = JSON.parse(ids);
        }
    }
    
    surveyChanged(): void {
        console.log(this.availableSurveyIndex);
        if (this.availableSurveyIndex === undefined) return;
        const id = this.availableSurveys[this.availableSurveyIndex][1];
        const key = this.availableSurveys[this.availableSurveyIndex][2];
        console.log(`/manage-survey/${id}/${key}`);
        this.router.navigateByUrl(`/manage-survey/${id}/${key}`, {skipLocationChange:false});
    }

    getSurvey(id: string): void {
        const [result, progress] = this.dataService.getData(`survey-edit?id=${this.id}&key=${this.key}`);
        result.subscribe((data: { ok: boolean, data?: Survey, error?: any }) => {
            if (data.ok) {
                console.log(data);
                if (data.data) {
                    this.survey = data.data;
                    this.getAnswerStatus();

                    const stored = this.availableSurveys.findIndex(x => x[1] === this.id && x[2] === this.key);
                    if (stored === -1) {
                        this.availableSurveyIndex = this.availableSurveys.push([this.survey.name, this.id, this.key]) - 1;
                        localStorage.setItem('Surveys', JSON.stringify(this.availableSurveys));
                    } else {
                        this.availableSurveyIndex = stored;
                        if (this.availableSurveys[this.availableSurveyIndex][0] !== this.survey.name) {
                            this.availableSurveys[this.availableSurveyIndex][0] = this.survey.name;
                            localStorage.setItem('Surveys', JSON.stringify(this.availableSurveys));
                        }
                    }
                }
            } else {
                console.error(data.error);
            }
        });
    }

    getAnswerStatus(): void {
        const [result, progress] = this.dataService.postData('answer-status', this.survey?.users.map(x => x._id) ?? []);
        result.subscribe((data: { id: string, count: number }[]) => {
            this.answerStatus = data.map(x => {return {name: this.getUsername(x.id), status: this.getStatus(x.count), count: x.count}});
            this.answerStatus.sort((a,b) => a.name.localeCompare(b.name));
        });
    }

    exportButton(): void {
        console.log('TODO');
    }

    deleteButton(): void {
        console.log('TODO');
    }

    copyLink(link: string): void {
        navigator.clipboard.writeText(link);
        this.snackBar.open('Copied', 'OK', {duration: 3000});
    }


    // Survey Completion -------------------------------------------------------
    getTotalStatus(): string {
        let total = this.survey?.questions.length ?? 0;
        total *= this.survey?.users.length ?? 0;

        let sum = 0;
        this.answerStatus?.forEach(x => sum += x.count);

        if (total === 0) return '';
        return `${Math.round((sum/total)*100)}%`;
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
            return `${Math.round((count/total)*100)}%`;
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

}
