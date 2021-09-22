import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

@Component({
    selector: 'app-form-rank',
    templateUrl: './form-rank.component.html',
    styleUrls: ['./form-rank.component.scss']
})
export class FormRankComponent implements OnChanges {

    @Input() choices: string[] = [];

    @Input() editable = false;
    @Input() loading = false;
    @Input() clear = -1;

    @Output() aEditText = new EventEmitter<number>();
    @Output() aRandomize = new EventEmitter<number>();
    @Output() aDelete = new EventEmitter<number>();
    @Output() aAdd = new EventEmitter<void>();

    @Output() aUpdate = new EventEmitter<number[]>();
    answers: string[] = [];

    constructor() { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['clear']) {
            if (this.editable) {
                this.answers = this.choices
            } else {
                this.answers = [];
                this.choices.forEach(c => {
                    this.answers.push(c);
                });
            }
        }
    }

    drop(event: CdkDragDrop<string[]>) {
        moveItemInArray(this.choices, event.previousIndex, event.currentIndex);
        this.onChange();
    }

    onChange() {
        this.aUpdate.emit(this.choices.map(x => this.answers.indexOf(x)))
    }

}
