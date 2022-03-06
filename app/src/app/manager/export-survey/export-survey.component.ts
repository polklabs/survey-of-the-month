import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CsvExportService } from 'src/app/core/services/csvExport.service';
import { SurveyContainer } from 'src/app/shared/model/survey-container.model';

@Component({
    selector: 'app-export-survey',
    templateUrl: './export-survey.component.html',
    styleUrls: ['./export-survey.component.scss']
})
export class ExportSurveyComponent implements OnInit {

    showUsers = true;
    qList: { id: string, include: boolean, text: string }[] = [];

    constructor(
        private sanitizer: DomSanitizer,
        private csvExport: CsvExportService,
        public dialogRef: MatDialogRef<ExportSurveyComponent>,
        public dialog: MatDialog,
        @Inject(MAT_DIALOG_DATA) public data: { container: SurveyContainer },
    ) { }

    ngOnInit(): void {
        this.qList = this.data.container.survey.questions.map(q =>
            ({ id: q.questionId, include: true, text: this.getQuestionSubstring(q.text) })
        );
    }

    export(): void {
        const exportData = this.sanitizer.bypassSecurityTrustUrl(
            this.csvExport.export(this.data.container, this.showUsers, this.qList.filter(x => x.include).map(x => x.id))
        );
        const exportFilename = this.csvExport.exportName(this.data.container);
        const dialogRef = this.dialog.open(ExportLinkDialogComponent, {
            width: '250px',
            data: { href: exportData, filename: exportFilename },
        });
        dialogRef.afterClosed().subscribe(() => {
            this.onClose();
        });
    }

    onClose(): void {
        this.dialogRef.close();
    }

    getQuestionSubstring(text: string): string {
        if (!text) { return ''; }
        if (text.length <= 25) { return text; }
        return text.substring(0, 24) + '…';
    }

}

@Component({
    selector: 'app-export-link-dialog',
    template: '<div fxLayoutAlign="center"><a mat-raised-button download="{{data.filename}}" [href]="data.href" _target="blank" (click)="onClose()">Export</a></div>',
})
export class ExportLinkDialogComponent {
    constructor(
        private dialogRef: MatDialogRef<ExportLinkDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { href: SafeUrl, filename: string },
    ) { }

    onClose(): void {
        this.dialogRef.close();
    }
}
