import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-text-box',
    templateUrl: './text-box.component.html',
    styleUrls: ['./text-box.component.scss']
})
export class TextBoxComponent {

    constructor(
        public dialogRef: MatDialogRef<TextBoxComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { title: string, inputLabel: string, value: string, showPreview: boolean }) { }

    onNoClick(): void {
        this.dialogRef.close();
    }

}
