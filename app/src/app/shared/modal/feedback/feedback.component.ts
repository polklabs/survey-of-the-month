import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DataService } from 'src/app/core/services/data.service';
import { DialogService } from 'src/app/core/services/dialog.service';
import { APIData } from '../../model/api-data.model';

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
        private dialogService: DialogService,
        private dataService: DataService,
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
                this.dialogService.error(data.error);
            } else {
                this.dialogRef.close();
            }
            setTimeout(() => this.submitting = false, 1000);
        });
    }

}
