import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

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
    @Output() aOrder = new EventEmitter<{previousIndex: number, currentIndex: number}>();

    @Output() aUpdate = new EventEmitter<number[]>();
    answers: string[] = [];

    constructor() { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.clear) {
            if (this.editable) {
                this.answers = this.choices;
            } else {
                this.answers = [];
                this.choices.forEach(c => {
                    this.answers.push(c);
                });
            }
        }
    }

    drop(event: CdkDragDrop<string[]>): void {
        if (this.editable) {
            this.aOrder.emit(event);
        } else {
            moveItemInArray(this.answers, event.previousIndex, event.currentIndex);
            this.onChange();
        }
    }

    onChange(): void {
        this.aUpdate.emit(this.answers.map(x => this.choices.indexOf(x)));
    }

    move(index: number, direction: 1 | -1): void {
        this.aOrder.emit({previousIndex: index, currentIndex: index + direction});
    }

}
