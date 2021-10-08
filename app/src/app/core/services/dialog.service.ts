import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent } from 'src/app/shared/modal/confirm-dialog/confirm-dialog.component';
import { FeedbackComponent } from 'src/app/shared/modal/feedback/feedback.component';
import { OkDialogComponent } from 'src/app/shared/modal/ok-dialog/ok-dialog.component';
import { TextBoxComponent } from 'src/app/shared/modal/text-box/text-box.component';
import { APIError } from 'src/app/shared/model/api-data.model';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class DialogService {

    constructor(public dialog: MatDialog) { }

    yesNo(content = '', title = 'Confirm'): Observable<boolean> {
        const DIALOG_DATA = {
            width: 'auto',
            height: 'auto',
            maxWidth: '800px',
            minWidth: '300px',
            autoFocus: false,
            data: {title, content, ok: 'Yes', cancel: 'No'}};
        const dialogRef = this.dialog.open(ConfirmDialogComponent, DIALOG_DATA);
        return dialogRef.afterClosed();
    }

    confirm(content = '', title = 'Confirm'): Observable<boolean> {
        const DIALOG_DATA = {
            width: 'auto',
            height: 'auto',
            maxWidth: '800px',
            minWidth: '300px',
            autoFocus: false,
            data: {title, content, ok: 'Ok', cancel: 'Cancel'}};
        const dialogRef = this.dialog.open(ConfirmDialogComponent, DIALOG_DATA);
        return dialogRef.afterClosed();
    }

    alert(content = '', title = 'Alert'): Observable<boolean> {
        const DIALOG_DATA = {
            width: 'auto',
            height: 'auto',
            maxWidth: '800px',
            minWidth: '300px',
            autoFocus: false,
            data: {title, content}};
        const dialogRef = this.dialog.open(OkDialogComponent, DIALOG_DATA);
        return dialogRef.afterClosed();
    }

    error(error?: APIError): Observable<boolean> {
        if (!error) {
            const DIALOG_DATA = {
                width: 'auto',
                height: 'auto',
                maxWidth: '800px',
                minWidth: '300px',
                autoFocus: false,
                data: {title: 'Unknown Error', content: `An unknown error occurred.\n\nThings to try:\n\tCheck your internet connection\n\tCheck the URL\n\tRefresh the page (F5)\n\tTry a different device/broswer\n\nIf none of the above worked you can report this error <a href="${environment.githubIssues}" target="_blank">here</a>`}};
            const dialogRef = this.dialog.open(OkDialogComponent, DIALOG_DATA);
            return dialogRef.afterClosed();
        } else {
            const DIALOG_DATA = {
                width: 'auto',
                height: 'auto',
                maxWidth: '800px',
                minWidth: '300px',
                autoFocus: false,
                data: {title: 'Error', content: `An error occurred: ${error.body.error} - ${error.body.reason}\n\nThings to try:\n\tCheck your internet connection\n\tCheck the URL\n\tRefresh the page (F5)\n\tTry a different device/broswer\n\nIf none of the above worked you can report this error <a href="${environment.githubIssues}" target="_blank">here</a>`}};
            const dialogRef = this.dialog.open(OkDialogComponent, DIALOG_DATA);
            return dialogRef.afterClosed();
        }
    }

    feedback(): void {
        const modalData = {
            width: 'auto',
            height: 'auto',
            maxWidth: '800px',
            minWidth: '300px',
            autoFocus: false
        };
        this.dialog.open(FeedbackComponent, modalData);
    }

    textInput(title: string, inputLabel: string, value: string = '', showPreview = true): Observable<any> {
        const dialogRef = this.dialog.open(TextBoxComponent, {
            width: 'auto',
            height: 'auto',
            maxWidth: '800px',
            minWidth: '300px',
            autoFocus: false,
            data: { title, inputLabel, value, showPreview }
        });
        return dialogRef.afterClosed();
    }
}
