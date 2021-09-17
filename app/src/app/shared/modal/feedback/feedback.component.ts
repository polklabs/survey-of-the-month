import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DataService } from 'src/app/core/services/data.service';
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
    private dialog: MatDialog, 
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

  updateTypeField(type: string) {
    const field = this.feedback.get('type');
    if (!field) return;
    field.setValue(type);
    field.updateValueAndValidity();
  }

  getTypeField(): string {
    const field = this.feedback.get('type');
    if (!field) return '';
    return field.value;
  }

  submit(): void {
    if (!this.feedback.valid) return;
    this.submitting = true;

    const [result, _] = this.dataService.postData('feedback', this.feedback.value);
    result.subscribe((data: {ok: boolean, error?: string}) => {
      if (!data.ok) {
        this.submitError(data.error??'');
      } else {
        this.dialogRef.close();
      }
      setTimeout(() => this.submitting = false, 1000);
    });
  }

  submitError(error: string): void {
    const DIALOG_DATA = {data: {title: 'Error Submitting', content: `An error occurred while trying to submit your feedback.\n\nError:\n${JSON.stringify(error)}\n\nPlease submit the issue <a href="https://github.com/polklabs/survey-of-the-month/issues" target="_blank" rel="noreferrer">here</a>`}}
    this.dialog.open(OkDialogComponent, DIALOG_DATA);
  }

}
