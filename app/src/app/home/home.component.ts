import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { DataService } from '../core/services/data.service';
import { DialogService } from '../core/services/dialog.service';
import { LocalStorageService } from '../core/services/local-storage.service';
import { APIData } from '../shared/model/api-data.model';
import { SurveysStorage } from '../shared/model/local-storage.model';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

    title = 'Survey Of The Month';
    subtitle = 'hello';
    text = 'This is a survey maker/taker/generator app';

    availableSurveys: SurveysStorage[] = [];

    timeout = 10000;
    progress = 0;

    constructor(
        private dataService: DataService,
        private dialogService: DialogService,
        private localStorageService: LocalStorageService) { }

    ngOnInit(): void {
        const [result, _] = this.dataService.getData('home');
        result.subscribe((data: { subtitle: string, text: string }) => {
            this.subtitle = data.subtitle;
            this.text = data.text;
        });

        if (environment.production) {
            let timer = setInterval(() => this.runTimer(), 150);
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    clearInterval(timer);
                } else {
                    timer = setInterval(() => this.runTimer(), 150);
                }
            });
        }

        this.localStorageService.getSurveysWatch().subscribe(
            s => {
                this.availableSurveys = s;
                this.availableSurveys.sort((a, b) => a.name.localeCompare(b.name));
            }
        );
    }

    updateSubtitle(): void {
        const [result, _] = this.dataService.getData('single?id=home_page_subtitle');
        result.subscribe((data: APIData) => {
            this.subtitle = data.data;
        });
    }

    runTimer(): void {
        this.timeout -= 150;

        if (this.timeout <= 0) {
            this.updateSubtitle();
            this.timeout = 10000;
        }

        this.progress = (this.timeout / 10000) * 100;
    }

    openFeedback(): void {
        this.dialogService.feedback();
    }

    openGithub(): void {
        window.open(environment.github, '_blank');
    }

}
