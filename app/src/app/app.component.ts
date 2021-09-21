import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { LocalStorageService } from './core/services/local-storage.service';
import { FeedbackComponent } from './shared/modal/feedback/feedback.component';
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
        private localStorageService: LocalStorageService
    ) {
        iconRegistry.addSvgIcon('github', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/github-circle-white-transparent.svg'));
    }

    ngOnInit(): void {
        this.availableSurveys = this.localStorageService.getSurveys();
    }

    openFeedback(): void {
        const modalData = {
            width: 'auto',
            height: 'auto',
            maxWidth: '95vw',
            minWidth: '300px',
            autoFocus: false
        }
        this.dialog.open(FeedbackComponent, modalData);
    }

}
