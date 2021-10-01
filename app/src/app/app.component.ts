import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import { DataService } from './core/services/data.service';
import { DialogService } from './core/services/dialog.service';
import { LocalStorageService } from './core/services/local-storage.service';
import { FeedbackComponent } from './shared/modal/feedback/feedback.component';
import { TextBoxComponent } from './shared/modal/text-box/text-box.component';
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
        private dialog: MatDialog,
        private localStorageService: LocalStorageService,
        private dataService: DataService,
        private snackBar: MatSnackBar,
        private dialogService: DialogService,
    ) {
        iconRegistry.addSvgIcon('github', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/github-circle-white-transparent.svg'));
    }

    ngOnInit(): void {
        this.localStorageService.getSurveysWatch().subscribe(
            s => {
                this.availableSurveys = s;
            }
        );
    }

    openFeedback(): void {
        const modalData = {
            width: 'auto',
            height: 'auto',
            maxWidth: '95vw',
            minWidth: '300px',
            autoFocus: false
        };
        this.dialog.open(FeedbackComponent, modalData);
    }

    lostLink(): void {
        const text = 'If you have lost a survey link enter the email you saved with the survey to retrieve it.';
        const modalData = {
            width: 'auto',
            height: 'auto',
            maxWidth: '95vw',
            minWidth: '300px',
            autoFocus: false,
            data: { title: text, inputLabel: 'Email', value: '', showPreview: false }
        };
        this.dialog.open(TextBoxComponent, modalData).afterClosed().subscribe(
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
