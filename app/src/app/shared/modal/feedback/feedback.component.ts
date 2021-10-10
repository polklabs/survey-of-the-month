import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DataService } from 'src/app/core/services/data.service';
import { DialogService } from 'src/app/core/services/dialog.service';
import { environment } from 'src/environments/environment';
import { APIData } from '../../model/api-data.model';
import { OkDialogComponent } from '../ok-dialog/ok-dialog.component';

@Component({
    selector: 'app-feedback',
    templateUrl: './feedback.component.html',
    styleUrls: ['./feedback.component.scss']
})
export class FeedbackComponent implements OnInit {

    feedback!: FormGroup;
    submitting = false;

    constructor(
        private formBuilder: FormBuilder,
        private dialogRef: MatDialogRef<FeedbackComponent>,
        private dataService: DataService,
        private dialog: MatDialog
    ) { }

    ngOnInit(): void {
        this.feedback = this.formBuilder.group({
            type: 'idea',
            subject: ['', Validators.required.bind(this)],
            body: ['', Validators.required.bind(this)],
            returnAddress: ''
        });
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    updateTypeField(type: string): void {
        const field = this.feedback.get('type');
        if (!field) { return; }
        field.setValue(type);
        field.updateValueAndValidity();
    }

    getTypeField(): string {
        const field = this.feedback.get('type');
        if (!field) { return ''; }
        return field.value;
    }

    submit(): void {
        if (!this.feedback.valid) { return; }
        this.submitting = true;

        const [result, _] = this.dataService.postData('feedback', this.feedback.value);
        result.subscribe((data: APIData) => {
            if (!data.ok) {
                const DIALOG_DATA = {
                    width: 'auto',
                    height: 'auto',
                    maxWidth: '800px',
                    minWidth: '300px',
                    autoFocus: false,
                    data: {title: 'Error', content: `An error occurred: ${data.error?.body.error ?? 'Unknown'} - ${data.error?.body.reason ?? 'Unknown'}\n\nThings to try:\n\tCheck your internet connection\n\tCheck the URL\n\tRefresh the page (F5)\n\tTry a different device/broswer\n\nIf none of the above worked you can report this error <a href="${environment.githubIssues}" target="_blank">here</a>`}};
                this.dialog.open(OkDialogComponent, DIALOG_DATA);
            } else {
                this.dialogRef.close();
            }
            setTimeout(() => this.submitting = false, 1000);
        });
    }

}
