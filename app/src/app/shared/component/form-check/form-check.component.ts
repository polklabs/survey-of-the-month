import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

@Component({
    selector: 'app-form-check',
    templateUrl: './form-check.component.html',
    styleUrls: ['./form-check.component.scss']
})
export class FormCheckComponent implements OnChanges {

    @Input() choices: string[] = [];

    @Input() editable = false;
    @Input() loading = false;
    @Input() clear = 0;

    @Output() aEditText = new EventEmitter<number>();
    @Output() aRandomize = new EventEmitter<number>();
    @Output() aDelete = new EventEmitter<number>();
    @Output() aAdd = new EventEmitter<void>();
    @Output() aOrder = new EventEmitter<{previousIndex: number, currentIndex: number}>();

    @Output() aUpdate = new EventEmitter<string[]>();
    answers: boolean[] = [];

    constructor() { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.clear) {
            this.answers = [];
            this.choices.forEach(() => {
                this.answers.push(false);
            });
        }
    }

    addAnswer(): void {
        this.answers.push(false);
        this.aAdd.emit();
    }

    deleteAnswer(i: number): void {
        this.answers.splice(i, 1);
        this.aDelete.emit(i);
    }

    onChange(): void {
        this.aUpdate.emit(this.answers.map(x => x ? 'true' : 'false'));
    }

    move(index: number, direction: 1 | -1): void {
        this.aOrder.emit({previousIndex: index, currentIndex: index + direction});
    }

}
