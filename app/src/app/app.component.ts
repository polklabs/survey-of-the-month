import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { FeedbackComponent } from './shared/modal/feedback/feedback.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    title = 'app';
    year = (new Date()).getFullYear();

    constructor(
        iconRegistry: MatIconRegistry,
        sanitizer: DomSanitizer,
        private dialog: MatDialog
    ) {
        iconRegistry.addSvgIcon('github', sanitizer.bypassSecurityTrustResourceUrl('assets/icons/github-circle-white-transparent.svg'));
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
