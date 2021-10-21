import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import { DataService } from './core/services/data.service';
import { DialogService } from './core/services/dialog.service';
import { LocalStorageService } from './core/services/local-storage.service';
import { APIData } from './shared/model/api-data.model';
import { SurveysStorage } from './shared/model/local-storage.model';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

    title = 'app';
    year = (new Date()).getFullYear();

    availableSurveys: SurveysStorage[] = [];

    constructor(
        iconRegistry: MatIconRegistry,
        sanitizer: DomSanitizer,
        private localStorageService: LocalStorageService,
        private dataService: DataService,
        private snackBar: MatSnackBar,
        private dialogService: DialogService
    ) {
        iconRegistry.addSvgIcon('github', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/github-circle-white-transparent.svg'));
    }

    ngOnInit(): void {
        this.localStorageService.getSurveysWatch().subscribe(
            s => {
                this.availableSurveys = s;
                this.availableSurveys.sort((a, b) => a.name.localeCompare(b.name));
            }
        );

        setTimeout(() => {
            if (!this.localStorageService.getVisited()) {
                this.dialogService.alert('Thank you for visiting Survey Of The Month!\n\nThe site is still a work in progress. If you experience any issues please submit feedback at the top of the page.', 'Welcome!');
                this.localStorageService.setVisited();
            }
        }, 1);
    }

    openFeedback(): void {
        this.dialogService.feedback();
    }

    lostLink(): void {
        this.dialogService.textInput(
            'If you have lost a survey link enter the email you saved with the survey to retrieve it.',
            'Email',
            '',
            false
        ).subscribe(
            (result?: string) => {
                if (result) {
                    const email = result.trim().toLowerCase();
                    const [msg, _] = this.dataService.getData('find?email=' + email);
                    msg.subscribe(
                        (data: APIData) => {
                            if (data.ok) {
                                this.snackBar.open('Email Sent to ' + email, 'OK', { duration: 3000 });
                            } else {
                                this.dialogService.error(data.error);
                            }
                        }
                    );
                }
            }
        );
    }

}
