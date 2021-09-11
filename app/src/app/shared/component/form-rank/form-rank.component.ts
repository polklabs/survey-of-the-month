import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-form-rank',
    templateUrl: './form-rank.component.html',
    styleUrls: ['./form-rank.component.scss']
})
export class FormRankComponent {

    @Input() choices: string[] = [];

    @Input() editable = false;
    @Input() loading = false;

    @Output() aEditText = new EventEmitter<number>();
    @Output() aRandomize = new EventEmitter<number>();
    @Output() aDelete = new EventEmitter<number>();
    @Output() aAdd = new EventEmitter<void>();

    constructor() { }

    drop(event: CdkDragDrop<string[]>) {
        moveItemInArray(this.choices, event.previousIndex, event.currentIndex);
    }

}
